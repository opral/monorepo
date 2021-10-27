/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import { ChangeEvent, useContext, useState } from "react";
import { I18nContext } from "../i18n/i18n-react";
import { useRouter } from "next/dist/client/router";

const Home: NextPage = () => {
  const { LL } = useContext(I18nContext);

  const router = useRouter();

  const [name, setName] = useState("");

  const [color, setColor] = useState("blue");

  async function handleLanguageSelection(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    // setting the i18n route. Basically, it replaces the language slug in the route with a new one.
    // Replacing the language slug will automatically set the language in the _app.tsx component.
    // read more here https://docs.inlang.dev/definitions/i18n-routing
    await router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: event.target.value }
    );
  }

  return (
    <div className="mx-auto p-4 flex flex-col space-y-4 items-center justify-center bg-base-100">
      <div className="max-w-4xl">
        <div className="flex justify-between items-center">
          <form>
            <label className="label">
              {LL.random_prefix_select_language()}
            </label>
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
            {LL.random_prefix_star_inlang()}
          </a>
        </div>
        <br />
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r py-1 from-purple-400 via-pink-500 to-red-500">
          {LL.random_prefix_welcome()}
        </h1>
        <br />
        <div className="grid grid-cols-2 gap-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title">
                {LL.random_prefix_localized_by_us()}
              </h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {LL.random_prefix_as_name()}
                  </span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={LL.random_prefix_enter_name()}
                  className="input input-bordered"
                />
              </div>
              <br />
              <p className="text-sm pb-1">
                {LL.random_prefix_ask_favorite_color()}
              </p>
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
                {LL.random_prefix_interpolated_string({
                  color: color,
                  name: name,
                })}
              </p>
            </div>
          </div>
          <div className="card shadow">
            <figure>
              <img
                src="https://raw.githubusercontent.com/inlang/inlang/main/assets/highlight-text.gif"
                alt="Highlight text and send to inlang."
              />{" "}
            </figure>
            <div className="card-body">
              <h2 className="card-title">2. Localize this card yourself</h2>

              <a
                className="link"
                href="https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension"
                target="_blank"
                rel="noreferrer"
              >
                1. Download the VSCode extension
              </a>
              <p>2. Highlight the text you want to localize.</p>
              <p>
                3. Open the context menu (right click) and press send to inlang
              </p>
              <p>
                4. Enter a key name, pre-fixed a random id (to avoid namespace
                collisions), and wait up to 2 seconds.
              </p>
              <br />
              <p>
                Bonus: {name}, localize this text as you did before. What
                happens?
              </p>
            </div>
          </div>
        </div>
        <br />
        <div className="card shadow">
          <div className="card-body">
            <h2 className="card-title">
              {LL.random_prefix_invite_collaborators()}
            </h2>
            <div className="grid grid-cols-2 gap-4 justify-items-center">
              <div className="flex flex-col justify-center">
                <a
                  href="https://inlang.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="link-primary text-lg"
                >
                  {LL.random_prefix_create_project()}
                </a>
                <br />
                <p className="text-lg">
                  {LL.random_prefix_replace_project_id()}
                </p>
                <p className="text-sm text-gray-500">
                  {LL.random_prefix_find_project_id()}
                </p>
                <br />
                <p className="text-lg">{LL.random_prefix_npm_run_dev()}</p>
                <p className="text-sm text-gray-500">
                  {LL.random_prefix_linting_errors()}
                  <a
                    className="link-secondary"
                    href="https://cdn.forms-content.sg-form.com/e22e6493-370b-11ec-9784-62d300bd6ea3"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {LL.random_prefix_newsletter()}
                  </a>
                </p>
              </div>
              <img
                className="h-80 w-80"
                src="https://raw.githubusercontent.com/inlang/inlang/main/assets/step2-half.gif"
              ></img>
            </div>
          </div>
        </div>
        <br />
        <div className="grid grid-cols-2 gap-20 justify-items-center">
          <div>
            <h2 className="card-title">{LL.random_prefix_early_alpha()}</h2>
            <p>{LL.random_prefix_feedback_helps_us()}</p>
            <a
              href="https://submission.bromb.co/inlang/examples"
              className="link-primary"
            >
              {LL.random_prefix_ask_feedback_on_this_example()}
            </a>
          </div>
          <div>
            <h2 className="card-title">Community</h2>
            <div className="flex space-x-10 items-center">
              <a
                href="https://github.com/inlang/inlang"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  alt="GitHub"
                  className="mx-auto"
                  height="32"
                  width="32"
                  src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/github.svg"
                />
                GitHub
              </a>
              <a
                href="https://discord.gg/CUkj4fgz5K"
                target="_blank"
                rel="noreferrer"
              >
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
        <iframe
          className="w-full h-96"
          src="https://cdn.forms-content.sg-form.com/e22e6493-370b-11ec-9784-62d300bd6ea3"
        />
      </div>
    </div>
  );
};

export default Home;
