/**
 * Showcased repositories that are using inlang.
 *
 * If you want to showcase your repository, edit the following
 * list and add your repository below.
 */
export const repositories: Repositories = [
  {
    owner: "opral",
    repository: "example",
    description: "Example repository that showcases inlang.",
  },
  // {
  // 	owner: "calcom",
  // 	repository: "cal.com",
  // 	description: "Scheduling infrastructure for absolutely everyone.",
  // },
  {
    owner: "hiddify",
    repository: "hiddify-next",
    description:
      "Multi-platform auto-proxy client, supporting Sing-box, X-ray, TUIC, Hysteria, Reality, Trojan, SSH etc. ",
  },
  {
    owner: "StanGirard",
    repository: "quivr",
    description: "Your GenAI Second Brain 🧠",
  },
  {
    owner: "AppFlowy-IO",
    repository: "AppFlowy",
    description:
      "AppFlowy is an open-source alternative to Notion. You are in charge of your data and customizations. Built with Flutter and Rust.",
  },
  {
    owner: "remnoteio",
    repository: "translation",
    description: "The all-in-one tool forthinking and learning",
  },
  {
    owner: "osmosis-labs",
    repository: "osmosis-frontend",
    description: "Web interface for Osmosis Zone",
  },
  {
    owner: "flornkm",
    repository: "florians-site",
    description: "Personal Website of Florian Kiem.",
  },
  {
    owner: "dermotduffy",
    repository: "frigate-hass-card",
    description: "A Lovelace card for Frigate in Home Assistant",
  },
];

type Repositories = Array<{
  owner: string;
  repository: string;
  description: string;
}>;
