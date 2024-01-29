import classnames from "classnames";

import styles from "./Heading.module.css";
import Container from "./Container";

interface IHeadingProps {
  title: string;
  subtitle?: string;
  withSubheadline?: boolean;
  isFrame?: boolean;
}

export function Heading({
  title,
  subtitle,
  withSubheadline,
  isFrame = false,
}: IHeadingProps) {
  return (
    <section
      className={classnames(
        isFrame ? styles.containerFrame : styles.container,
        withSubheadline && styles.withSubheadline
      )}
    >
      <Container>
        <h2
          className={classnames(
            styles.title,
            !isFrame && !subtitle && styles.titleAlone
          )}
        >
          {title}
        </h2>
        {subtitle && <h3 className={styles.subtitle}>{subtitle}</h3>}
      </Container>
    </section>
  );
}
