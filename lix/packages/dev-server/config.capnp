using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    ( name = "docker", external = (address = "unix:/var/run/docker.sock") ), # /Users/jan/.colima/default/docker.sock
    ( name = "route-worker", worker = .routeWorker ),
    ( name = "internet",
      network = (
        allow = [
          "private",
          "public",
          "local"
        ],
        tlsOptions = (trustBrowserCas = true)
      )
    )
  ],

  sockets = [
    ( name = "ingest", address = ":80", http = (), service = "route-worker" ),
  ],
);

const routeWorker :Workerd.Worker = (
  compatibilityFlags = ["nodejs_compat"],
  compatibilityDate = "2023-12-01",
  modules = [
    ( name = "worker.js", esModule = embed "worker.js" ),
  ],
  bindings = [
    ( name = "docker", service = "docker" ),
  ],
);
