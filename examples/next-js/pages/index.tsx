/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import LanguageSelector from "../components/LanguageSelector";
import { ChangeEvent, useContext, useState } from "react";
import { I18nContext } from "../i18n/i18n-react";
import { useRouter } from "next/dist/client/router";
import { Locales } from "../i18n/i18n-types";

const Home: NextPage = () => {
  // internal state of typesafe-i18n
  const { LL, setLocale, locale } = useContext(I18nContext);
  // state of i18n routing read more here https://docs.inlang.dev/definitions/i18n-routing
  const router = useRouter();

  const [name, setName] = useState("");

  const [color, setColor] = useState("blue");

  async function handleLanguageSelection(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    // setting the i18n route read more here https://docs.inlang.dev/definitions/i18n-routing
    const success = await router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: event.target.value }
    );
    // if i18n routing was successfull -> set the state of typesafe-i18n
    if (success) {
      setLocale(event.target.value as Locales);
    }
  }

  return (
    <div className="w-screen h-screen p-4 flex flex-col space-y-4 items-center justify-center bg-base-100">
      <div className="max-w-4xl">
        <div className="flex justify-between items-center">
          <form>
            <label className="label">{"Select a language: "}</label>
            <select
              className="select select-bordered w-full max-w-xs"
              value={router.locale}
              onChange={handleLanguageSelection}
            >
              <option value="en">🇬🇧 English</option>
              <option value="fr">🇫🇷 French</option>
              <option value="de">🇩🇪 German</option>
              <option value="nl">🇳🇱 Dutch</option>
              <option value="da">🇩🇰 Danish</option>
            </select>
          </form>
          <a
            href="https://github.com/inlang/inlang"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            {"⭐ Star inlang on GitHub"}
          </a>
        </div>
        <br />
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r py-1 from-purple-400 via-pink-500 to-red-500">
          {"Welcome to the inlang example"}
        </h1>
        <br />
        <div className="grid grid-cols-2 gap-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title">
                {"1. This card is already localized by us"}
              </h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{"What is your name?"}</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="enter your name"
                  className="input input-bordered"
                />
              </div>
              <br />
              <p className="text-sm pb-1">{"What is your favorite color?"}</p>
              <div className="flex space-x-2 justify-between">
                <button
                  onClick={() => setColor("blue")}
                  className={`btn btn-square btn-outline btn-info ${
                    color === "blue" ? "btn-active" : ""
                  } `}
                >
                  {" "}
                </button>
                <button
                  onClick={() => setColor("green")}
                  className={`btn btn-square btn-outline btn-success ${
                    color === "green" ? "btn-active" : ""
                  }`}
                >
                  {" "}
                </button>
                <button
                  onClick={() => setColor("orange")}
                  className={`btn btn-square btn-outline btn-warning ${
                    color === "orange" ? "btn-active" : ""
                  } `}
                >
                  {" "}
                </button>
                <button
                  onClick={() => setColor("red")}
                  className={`btn btn-square btn-outline btn-error ${
                    color === "red" ? "btn-active" : ""
                  } `}
                >
                  {" "}
                </button>
              </div>
              <div className="divider" />
              <p className="font-bold">
                {"My name is {name} and my favorite color is {color}."}
              </p>
            </div>
          </div>
          <div className="card shadow">
            <figure>
              <img
                src="/highlight-text.gif"
                alt="Highlight text and send to inlang."
              />{" "}
            </figure>
            <div className="card-body">
              <h2 className="card-title">{"2. Localize this card yourself"}</h2>

              <a
                className="link"
                href="https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension"
                target="_blank"
                rel="noreferrer"
              >
                {"1. Download the VSCode extension"}
              </a>
              <p>{"2. Highlight the text you want to localize."}</p>
              <p>
                {
                  "3. Open the context menu (right click) and press send to inlang"
                }
              </p>
              <p>
                {
                  "4. Enter a key name, pre-fixed a random id (to avoid namespace collisions), and wait up to 2 seconds."
                }
              </p>
              <br />
              <p>
                {
                  "Bonus: {name}, localize this text as you did before. What happens?"
                }
              </p>
              <br />
              <a
                href="https://docs.inlang.dev/getting-started/dashboard"
                className="link-primary"
              >
                {"Want to see the dashboard?"}
              </a>
            </div>
          </div>
        </div>
        <br />
        <div className="card shadow">
          <div className="card-body grid grid-cols-2 gap-20">
            <div>
              <h2 className="card-title">{"Inlang is in early alpha"}</h2>
              <p>{"Every feedback we get helps us tremendously."}</p>
              <a
                href="https://submission.bromb.co/inlang/examples"
                className="link-primary"
              >
                {"Do you have feedback on this example?"}
              </a>
            </div>
            <div>
              <h2 className="card-title">Community</h2>
              <div className="flex space-x-10 items-center">
                <a href="https://github.com/inlang/inlang">
                  <img
                    alt="GitHub"
                    className="mx-auto"
                    height="32"
                    width="32"
                    src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/github.svg"
                  />
                  GitHub
                </a>
                <a href="https://discord.gg/CUkj4fgz5K">
                  <img
                    alt="Discord"
                    height="32"
                    className="mx-auto"
                    width="32"
                    src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/discord.svg"
                  />
                  Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
