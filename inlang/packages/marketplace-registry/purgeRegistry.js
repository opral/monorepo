import fs from "node:fs/promises";
import fetch from "node-fetch";

const manifestLinks = JSON.parse(await fs.readFile("./registry.json", "utf-8"));

const purgeArray = [];

for (const type of Object.keys(manifestLinks)) {
  // eslint-disable-next-line no-undef
  console.info(`Purging ${type} manifests...`);

  for (const uniqueID of Object.keys(manifestLinks[type])) {
    const link = manifestLinks[type][uniqueID];

    if (link.includes("http")) {
      const linkWithoutCDN = link.replace("https://cdn.jsdelivr.net", "");
      purgeArray.push(linkWithoutCDN);
      const manifestFile = await fetch(link);
      await addManifestCDNLinks(manifestFile, true);
    } else {
      const manifestFile = await fs.readFile(link, "utf-8");
      await addManifestCDNLinks(manifestFile, false);
    }
  }
}

const jsonString = JSON.stringify(purgeArray);

const apiUrl = "https://purge.jsdelivr.net/";
const requestData = JSON.stringify({ path: JSON.parse(jsonString) });

// eslint-disable-next-line no-undef
await fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: requestData,
})
  .then((response) => response.text())
  /* Log the data to see status of the purge */
  .then((data) => {
    // eslint-disable-next-line no-undef, no-console
    console.log(data);
  })
  .catch((error) => {
    // eslint-disable-next-line no-undef
    console.error(error);
  });

async function addManifestCDNLinks(manifestFile, json) {
  let manifest;
  if (json) manifest = await manifestFile.json();
  else manifest = JSON.parse(manifestFile);

  if (
    manifest.readme &&
    manifest.readme.en.includes("https://cdn.jsdelivr.net")
  )
    purgeArray.push(manifest.readme.en.replace("https://cdn.jsdelivr.net", ""));
  if (manifest.icon && manifest.icon.includes("https://cdn.jsdelivr.net"))
    purgeArray.push(manifest.icon.replace("https://cdn.jsdelivr.net", ""));
  if (
    manifest.publisherIcon &&
    manifest.publisherIcon.includes("https://cdn.jsdelivr.net")
  )
    purgeArray.push(
      manifest.publisherIcon.replace("https://cdn.jsdelivr.net", ""),
    );
  if (manifest.gallery) {
    for (const image of manifest.gallery) {
      if (image.includes("https://cdn.jsdelivr.net") && image)
        purgeArray.push(image.replace("https://cdn.jsdelivr.net", ""));
    }
  }
}
