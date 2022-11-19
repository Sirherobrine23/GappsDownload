import { customChildProcess, extendFs } from "@the-bds-maneger/core-utils";
import path from "node:path";
import nodeAapt from "node-aapt";

export async function listPackages(androidVersion: string) {
  const android_dict = {
    "tiramisu": "tiramisu",
    "13": "tiramisu"
  };
  const repo_dir = path.resolve(__dirname, "../dist/Evox", android_dict[androidVersion]);
  const repo_url = "https://gitlab.com/EvoX/vendor_gms.git";
  if (!await extendFs.exists(repo_dir)) await customChildProcess.execFileAsync("git", ["clone", repo_url, "-b", android_dict[androidVersion], "--depth=1", repo_dir], {stdio: "inherit"});

  async function get_gapps_dict() {
    const supported_partitions = ["system", "system_ext", "product", "vendor"];
    const supported_types = {"privileged_apps": "priv-app", "apps": "app"};
    const gapps_dict: {
      [partition in (typeof supported_partitions)[number]]?: {
        partition: partition,
        type: (typeof supported_partitions)[number],
        folder: string,
        version_code: string,
        file: string,
        package: string,
        version: string,
        md5?: string
      }[]
    } = {};
    for (const partition of supported_partitions) {
      if (!await extendFs.exists(path.join(repo_dir, partition))) continue;
      if (!gapps_dict[partition]) gapps_dict[partition] = [];
      for (const supported_type in supported_types) {
        const partition_dir = path.join(repo_dir, partition, "packages", supported_type);
        if (!await extendFs.exists(partition_dir)) continue;
        for (const file_path of (await extendFs.readdirrecursive(partition_dir)).filter(file => String(file).endsWith(".apk")) as string[]) {
          const folder_name = file_path.split("/").at(-3);
          const info = await nodeAapt(file_path).catch((() => null));
          if (info === null) continue;
          gapps_dict[partition].push({
            partition,
            type: supported_types[supported_type],
            file: file_path,
            folder: folder_name,
            package: info.packageName,
            version: info.packageName,
            version_code: info.versionCode,
          });
        }
      }
    }

    return gapps_dict;
  }

  return {
    repo_dir,
    get_gapps_dict,
  };
}