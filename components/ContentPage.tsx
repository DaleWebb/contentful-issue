import React from "react";
import { Heading } from "./Heading";

export interface IQuery {
  sections: TSections;
}

export type TSections = {
  isFrame?: boolean;
  subtitle?: string;
  title?: string;
  withSubheadline?: boolean;
}[];

type Props = IQuery & { pagePath?: string };

export default function ContentPage(props: Props): JSX.Element {
  return (
    <>
      {props.sections.map((section: any, idx: number) => {
        if (!section) {
          return null;
        }

        switch (section.sectionName) {
          case "Heading":
            return (
              <Heading
                isFrame={section.isFrame}
                key={`${idx}-heading`}
                subtitle={section.subtitle}
                title={section.title}
                withSubheadline={section.withSubheadline}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
