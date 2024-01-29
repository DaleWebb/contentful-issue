This repo is a part of the Blacklane NextJS app responsible for rendering Contentful entries as React components.

## Issue

The `useContentfulLiveUpdates` hook now returns unlocalised entries, rather than localised entries when passed localised entries as arguments.

## Instructions

1. Create a .env.local file from the .env.example file with the correct values
2. Run `bun dev`
3. Go to this Contentful entry (a [SP] Custom Static Page content type that contains a [SP] Heading content type within the sections field): https://app.contentful.com/spaces/ov8o7v78mnye/environments/dale/entries/6MPVMGzXijUDW0Wr18Iv8e/preview/29OWtH0tQiFxegpYgTomNS?previousEntries=57ACpLKpVX2aCdY64wZvxq&focusedField=title&focusedLocale=en-US
4. Attempt to edit the "title" field
5. See the crash
