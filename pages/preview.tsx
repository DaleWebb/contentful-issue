import {
  ContentfulLivePreviewProvider,
  useContentfulLiveUpdates,
} from "@contentful/live-preview/react";
import { useMemo } from "react";
import { type Entry } from "contentful";
import type { GetServerSideProps } from "next";

import "@contentful/live-preview/style.css";
import {
  IFields,
  Locales,
  Localized,
  contentModels,
  getClient,
  mapContentfulEntry,
} from "@/utils";
import ContentPage from "@/components/ContentPage";

function isEntry<T>(maybeEntry: unknown): maybeEntry is Entry<T> {
  return (
    !!maybeEntry &&
    typeof maybeEntry === "object" &&
    "sys" in maybeEntry &&
    typeof maybeEntry.sys === "object" &&
    !!maybeEntry.sys &&
    "type" in maybeEntry.sys &&
    maybeEntry.sys.type === "Entry"
  );
}

function extractEntries<T>(entry: Entry<any>) {
  if (!entry.fields) return [];

  return Object.values(entry.fields)
    .map((valueOrEntry): Entry<T>[] => {
      if (isEntry<T>(valueOrEntry)) return [valueOrEntry];
      if (Array.isArray(valueOrEntry))
        return valueOrEntry.map<Entry<T>[]>(extractEntries).flat();

      return [];
    })
    .flat();
}

const isStaticPageEntry = (entry: Entry<unknown>): entry is Entry<IFields> =>
  Object.values(contentModels).includes(entry.sys.contentType.sys.id);

interface UseEntryPreviewOptions<T> {
  entry: Entry<T>;
  localizedEntry?: Entry<Localized<T>>;
  locale: Locales;
}

const useEntryPreview = <T,>({
  entry,
  locale,
  localizedEntry,
}: UseEntryPreviewOptions<T>) => {
  const liveEntries = useContentfulLiveUpdates([
    entry,
    ...extractEntries<T>(entry),
  ]);
  const liveLocalizedEntry = useContentfulLiveUpdates(localizedEntry);

  /**
   * This implements our custom fallback logic for localized versions of fields.
   */
  if (isStaticPageEntry(liveEntries[0]) && liveLocalizedEntry) {
    const typedLiveLocalizedEntry = liveLocalizedEntry as Entry<
      Localized<IFields>
    >;

    if (typedLiveLocalizedEntry.fields.localizedSections?.[locale]) {
      liveEntries[0].fields.sections =
        liveEntries[0].fields.localizedSections ?? [];
    }

    if (typedLiveLocalizedEntry.fields.localizedBottomSections?.[locale]) {
      liveEntries[0].fields.bottomSections =
        liveEntries[0].fields.localizedBottomSections;
    }
  }

  return useMemo(() => {
    const liveEntryMap = Object.fromEntries(
      liveEntries.map((liveEntry) => [liveEntry.sys.id, liveEntry])
    );

    function reconstructEntry<T extends Entry<any>>(
      reconstructableEntry: T
    ): T {
      return {
        ...reconstructableEntry,
        ...(reconstructableEntry.fields
          ? {
              fields: {
                ...reconstructableEntry.fields,
                ...Object.fromEntries(
                  Object.entries(reconstructableEntry.fields).map(
                    ([key, value]) => {
                      if (isEntry(value)) return [key, reconstructEntry(value)];
                      if (Array.isArray(value))
                        return [key, value.map(reconstructEntry)];

                      return [key, value];
                    }
                  )
                ),
              },
            }
          : {}),
      };
    }

    return reconstructEntry(liveEntryMap[entry.sys.id]);
  }, [entry, liveEntries]);
};

interface PreviewableComponentProps<T> {
  entry: Entry<T>;
  localizedEntry?: Entry<Localized<T>>;
  locale: Locales;
}

function PreviewableComponent<T>({
  entry,
  localizedEntry,
  locale,
}: PreviewableComponentProps<T>) {
  const entryPreview = useEntryPreview<T>({ entry, localizedEntry, locale });

  if (isStaticPageEntry(entryPreview))
    return <PreviewableStaticPage entry={entryPreview} locale={locale} />;

  return null;
}

interface PreviewableStaticPageProps {
  entry: Entry<IFields>;
  locale: Locales;
}

const PreviewableStaticPage = ({
  entry,
  locale,
}: PreviewableStaticPageProps) => {
  const props = mapContentfulEntry(entry);

  return (
    <ContentPage
      pagePath="/" // We don't need the real value for preview
      sections={[]}
      {...props}
    />
  );
};

type PageProps<T extends IFields> = PreviewableComponentProps<T>;

export default function Page<T extends IFields>({
  locale,
  ...props
}: PageProps<T>): JSX.Element {
  return (
    <ContentfulLivePreviewProvider locale={locale}>
      <div>
        <main role="main">
          <PreviewableComponent {...props} locale={locale} />
        </main>
      </div>
    </ContentfulLivePreviewProvider>
  );
}

export const getServerSideProps: GetServerSideProps<
  PageProps<any>,
  Record<string, undefined>,
  { environment: string; entryId: string; locale: Locales }
> = async ({ preview, previewData, query }) => {
  const isDevelopmentEnv = process.env.NODE_ENV === "development";

  if (!preview && !isDevelopmentEnv) {
    return {
      notFound: true,
    };
  }

  const { entryId, environment, locale } = isDevelopmentEnv
    ? {
        entryId: Array.isArray(query.entryId)
          ? query.entryId[0]
          : query.entryId,
        environment: Array.isArray(query.environment)
          ? query.environment[0]
          : query.environment,
        locale: Array.isArray(query.locale) ? query.locale[0] : query.locale,
      }
    : previewData ?? {};

  if (!entryId || !environment || !locale) {
    return {
      notFound: true,
    };
  }

  const previewClient = getClient({
    previewMode: true,
    environment,
  });

  const [entry, localizedEntry] = await Promise.all([
    previewClient.getEntry<IFields>(entryId, { locale }),
    previewClient.getEntry<Localized<IFields>>(entryId, { locale: "*" }),
  ]);

  return {
    props: {
      entry,
      localizedEntry,
      locale: locale as Locales,
    },
  };
};
