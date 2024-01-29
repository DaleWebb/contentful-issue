import { type NextApiRequest, type NextApiResponse } from "next";

const getQueryValue = (
  val: undefined | string | string[]
): undefined | string => {
  if (typeof val === "string") {
    return val;
  } else if (Array.isArray(val)) {
    return val[0];
  }
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): any {
  const accessToken = getQueryValue(req.query.access_token);
  const locale = getQueryValue(req.query.locale);
  const environment = getQueryValue(req.query.env_id);
  const entryId = getQueryValue(req.query.entry_id);

  if (!locale) return res.status(400).send("locale is required");
  if (!environment) return res.status(400).send("env_id is required");
  if (!entryId) return res.status(400).send("entry_id is required");

  const isDevelopmentEnvironment = process.env.NODE_ENV === "development";

  if (isDevelopmentEnvironment) {
    const query = new URLSearchParams({
      locale,
      environment,
      entryId,
    });

    res.redirect(`/preview?${query.toString()}`);
  } else {
    res.setPreviewData({
      locale,
      environment,
      entryId,
    });

    res.redirect("/preview");
  }
}
