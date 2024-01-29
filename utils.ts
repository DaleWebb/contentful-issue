import { ContentfulClientApi, Entry, createClient } from "contentful";
import isObject from "lodash/isObject";
import transform from "lodash/transform";

export const contentModels = {
  customStaticPage: "customStaticPage", // https://app.contentful.com/spaces/ov8o7v78mnye/content_types/customStaticPage/
  cityPage: "2od8TlD24wIUuaS02qE6q4", // https://app.contentful.com/spaces/ov8o7v78mnye/content_types/2od8TlD24wIUuaS02qE6q4/fields
  seoPage: "52n1Q7s5yEk46Ie0mI0ew4", // https://app.contentful.com/spaces/ov8o7v78mnye/content_types/52n1Q7s5yEk46Ie0mI0ew4/fields
};

const customSections = {
  spHeadingComponent: "Heading",
};

export const deepTransform = <
  T extends Record<string, any>,
  R extends Record<string, any>
>(
  obj: T,
  iterator: (key: keyof T, value: T[keyof T]) => [keyof R, R[keyof R]] | null
): R => {
  return transform<T, R>(obj, (acc, value, key) => {
    const pair = iterator(key, value);

    if (!pair) {
      return;
    }

    const [nextKey, nextValue] = pair;

    acc[nextKey] = isObject(nextValue)
      ? deepTransform<T, R[keyof R]>(nextValue, iterator)
      : nextValue;
  });
};

export const makePath = (...segments: string[]): string =>
  [
    "",
    ...segments
      .map((segment) =>
        (segment ? segment.split("/") : []).filter(Boolean).join("/")
      )
      .filter(Boolean),
    "",
  ].join("/");

export interface ContentfulOptions {
  previewMode?: boolean;
  environment?: string;
}

export function getClient(options?: ContentfulOptions): ContentfulClientApi {
  const previewMode = options?.previewMode ?? false;
  const environment = options?.environment ?? "master";

  const space = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
  const host = process.env.NEXT_PUBLIC_CONTENTFUL_HOST;

  const accessToken = previewMode
    ? process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW_ACCESS_TOKEN
    : process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;

  if (!accessToken || !space) {
    throw new Error("Please define the Contentful access token and space id.");
  }

  return createClient({
    accessToken,
    space,
    host: previewMode ? "preview.contentful.com" : host,
    environment,
  });
}

function generateSections(sections: IFields["sections"]) {
  if (!sections) {
    return null;
  }

  return sections?.map((section) => {
    if (!section.fields) {
      return null;
    }

    const sectionName =
      customSections[
        section.sys.contentType.sys.id as keyof typeof customSections
      ] ?? section.sys.contentType.sys.id;

    if (sectionName === "Heading") {
      return {
        sectionName,
        title: section?.fields.title,
        formatted: section?.fields.formatted,
        isFrame: section?.fields.isFrame,
        subtitle: section?.fields.subtitle,
        withSubheadline: section?.fields.withSubheadline,
      };
    }

    return {
      ...section.fields,
      anchorElementId: section?.fields.anchorElementId,
      name: section?.fields.name,
      sectionName,
    };
  });
}

export const mapContentfulEntry = (entry: Entry<IFields>) => {
  const { sections, bottomSections, urlPath } = entry.fields;

  if (!urlPath || urlPath === "/home") {
    return null;
  }

  const sectionsToBuild = generateSections(sections);

  const bottomSectionsToBuild = bottomSections
    ? generateSections(bottomSections)
    : [];

  const query = {
    sections: [...(sectionsToBuild ?? []), ...(bottomSectionsToBuild ?? [])],
  };

  // Remove keys with undefined values
  return deepTransform(query, (key, value) =>
    value === undefined ? null : [key, value]
  );
};

export interface IFields extends Record<string, unknown> {
  urlPath: string | null;
  sections: Array<{
    sys: { contentType: { sys: { id: string } } };
    fields: {
      [name: string]: {
        [value: string]: string;
      };
    };
  }>;
  localizedSections?: Array<{
    sys: { contentType: { sys: { id: string } } };
    fields: {
      [name: string]: {
        [value: string]: string;
      };
    };
  }>;
  bottomSections?: Array<{
    sys: { contentType: { sys: { id: string } } };
    fields: {
      [name: string]: {
        [value: string]: string;
      };
    };
  }>;
  localizedBottomSections?: Array<{
    sys: { contentType: { sys: { id: string } } };
    fields: {
      [name: string]: {
        [value: string]: string;
      };
    };
  }>;
  description: string;
  title: string;
  canonical?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  keywords: string;
}

export type Localized<T> = { [P in keyof T]: Record<Locales, T[P]> };

export enum Locales {
  EN = "en-US",
  DE = "de-DE",
  FR = "fr",
  ZH = "zh",
  ES = "es-ES",
  JA = "ja-JP",
}
