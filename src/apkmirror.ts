import { format } from "node:util";
import { httpRequest } from "@the-bds-maneger/core-utils";
import { toJson } from "xml2json";
import { JSDOM } from "jsdom"
import { writeFile } from "node:fs/promises";
import { compareVersions } from "compare-versions";

export const apkMap = {
  "com.android.chrome": "chrome",
  "com.android.facelock": "trusted-face",
  "com.android.vending": "google-play-store",
  "com.android.vending.leanback": "google-play-store-android-tv",
  "com.google.android.apps.books": "google-play-books",
  "com.google.android.apps.cloudprint": "cloud-print",
  "com.google.android.apps.docs": "drive",
  "com.google.android.apps.docs.editors.docs": "docs",
  "com.google.android.apps.docs.editors.sheets": "sheets",
  "com.google.android.apps.docs.editors.slides": "slides",
  "com.google.android.apps.enterprise.dmagent": "device-policy",
  "com.google.android.apps.fitness": "fit",
  "com.google.android.apps.gcs": "google-connectivity-services",
  "com.google.android.apps.inputmethod.hindi": "google-indic-keyboard",
  "com.google.android.apps.inputmethod.zhuyin": "google-zhuyin-input",
  "com.google.android.apps.magazines": "google-news",
  "com.google.android.apps.maps": "maps",
  "com.google.android.apps.mediashell": "chromecast-built-in",
  "com.google.android.apps.messaging": "messenger-google-inc",
  "com.google.android.apps.nexuslauncher": "pixel-launcher",
  "com.google.android.apps.photos": "photos",
  "com.google.android.apps.photos.vrmode": "google-photos-daydream",
  "com.google.android.apps.pixelmigrate": "data-transfer-tool",
  "com.google.android.apps.restore": "android-setup",
  "com.google.android.apps.translate": "translate",
  "com.google.android.apps.tachyon": "duo-by-google",
  "com.google.android.apps.turbo": "device-health-services",
  "com.google.android.apps.tv.launcherx": "google-tv-home-android-tv",
  "com.google.android.apps.tycho": "project-fi",
  "com.google.android.apps.walletnfcrel": "google-pay",
  "com.google.android.apps.wallpaper": "google-wallpaper-picker",
  "com.google.android.as": "device-personalization-services",
  "com.google.android.backdrop": "backdrop-daydream-android-tv",
  "com.google.android.backuptransport": "google-backup-transport",
  "com.google.android.calculator": "google-calculator",
  "com.google.android.calendar": "calendar",
  "com.google.android.configupdater": "configupdater",
  "com.google.android.contacts": "google-contacts",
  "com.google.android.deskclock": "clock",
  "com.google.android.dialer": "google-phone",
  "com.google.android.ears": "sound-search-for-google-play",
  "com.google.android.gm": "gmail",
  "com.google.android.gm.exchange": "exchange-services",
  "com.google.android.gms": "google-play-services",
  "com.google.android.gms.leanback": "google-play-services-android-tv",
  "com.google.android.googlecamera": "camera",
  "com.google.android.googlequicksearchbox": "google-search",
  "com.google.android.gsf": "google-services-framework",
  "com.google.android.gsf.login": "google-account-manager",
  "com.google.android.ims": "carrier-services-2",
  "com.google.android.inputmethod.japanese": "google-japanese-input",
  "com.google.android.inputmethod.korean": "google-korean-input",
  "com.google.android.inputmethod.latin": "gboard",
  "com.google.android.inputmethod.pinyin": "google-pinyin-input",
  "com.google.android.instantapps.supervisor": "google-play-services-for-instant-apps",
  "com.google.android.katniss": "google-app-for-android-tv-android-tv",
  "com.google.android.keep": "keep",
  "com.google.android.launcher": "google-now-launcher",
  "com.google.android.leanbacklauncher": "android-tv-launcher-android-tv",
  "com.google.android.marvin.talkback": "android-accessibility-suite",
  "com.google.android.marvin.talkback.leanback": "android-accessibility-suite-android-tv",
  "com.google.android.music": "google-play-music",
  "com.google.android.nexusicons": "pixel-launcher-icons",
  "com.google.android.onetimeinitializer": "google-one-time-init",
  "com.google.android.partnersetup": "google-partner-setup",
  "com.google.android.play.games": "google-play-games",
  "com.google.android.play.games.leanback": "google-play-games-android-tv",
  "com.google.android.projection.gearhead": "android-auto",
  "com.google.android.settings.intelligence": "settings-suggestions",
  "com.google.android.setupwizard": "setup-wizard",
  "com.google.android.soundpicker": "sounds",
  "com.google.android.storagemanager": "storage-manager",
  "com.google.android.street": "street-view",
  "com.google.android.syncadapters.contacts": "google-contacts-sync",
  "com.google.android.tag": "tags-google",
  "com.google.android.talk": "hangouts",
  "com.google.android.trichromelibrary": "trichrome-library",
  "com.google.android.tts": "google-text-to-speech-engine",
  "com.google.android.tv": "live-channels-android-tv",
  "com.google.android.tv.remote": "remote-control",
  "com.google.android.tvlauncher": "android-tv-home-android-tv",
  "com.google.android.tvrecommendations": "android-tv-core-services-android-tv",
  "com.google.android.videos": "google-play-movies",
  "com.google.android.videos.leanback": "google-play-movies-tv-android-tv",
  "com.google.android.videos.vrmode": "google-play-movies-tv-daydream",
  "com.google.android.webview": "android-system-webview",
  "com.google.android.youtube": "youtube",
  "com.google.android.youtube.tv": "youtube-for-android-tv-android-tv",
  "com.google.earth": "earth",
  "com.google.vr.vrcore": "google-vr-services"
}

type appSelect = keyof (typeof apkMap);
type downloadObject = {
  version: string,
  downloadUrls: {
    url: string,
    arch?: {arch: string, dep?: string},
    androidRequeriments: {
      [target in ("Min"|"Max"|"Target")]?: {version: string, API?: string}
    }
  }[]
}

export async function listPackages(androidVersion: string) {
  const host = "https://www.apkmirror.com";

  async function get_apk_versions_url(app: appSelect) {
    if (!apkMap[app]) throw new Error("Package not maped");
    const feedUrl = format("%s/apk/google-inc/%s/feed/", host, apkMap[app]);
    const data: string[] = (toJson((await httpRequest.bufferFetch(feedUrl)).data.toString("utf8"), {object: true})).rss["channel"]["item"].map(data => data.link);
    return Promise.all(data.map(async url => {
      const { document } = (new JSDOM((await httpRequest.bufferFetch(url)).data, {url})).window;
      const downloadUrl = Array.from(document.querySelectorAll(".apkm-badge")).filter(element => element.innerHTML === "APK").map(element => element.previousElementSibling["href"] as string);
      let version = document.querySelector("span.active.accent_color");
      if (version === null) document.querySelector("a.active.accent_color");
      return {version: version?.textContent, downloadUrl};
    }));
  }

  async function get_apk_download(app: appSelect) {
    const versions = await get_apk_versions_url(app);
    const dataReturn: downloadObject[] = []
    for (const version of versions) {
      const downloadUrls = await Promise.all(version.downloadUrl.map(async url => {
        const { document } = (new JSDOM((await httpRequest.bufferFetch(url)).data, {url})).window;
        const data = document.querySelector("#file > div.row.d-flex.f-a-start > div.center.f-sm-50 > div > a")?.["href"];
        const arch = document.querySelector("#file > div.row.d-flex.f-a-start > div:nth-child(1) > div > div:nth-child(4) > div")?.innerHTML?.split("<br>")?.reduce((mount, data) => {
          if (!mount.arch) mount.arch = data.trim();
          else if (!mount.dep) mount.dep = data.trim();
          return mount;
        }, {} as downloadObject["downloadUrls"][0]["arch"]);
        const androidRequeriments = document.querySelector("#file > div.row.d-flex.f-a-start > div:nth-child(1) > div > div:nth-child(3) > div").innerHTML.split("<br>").map(element => {
          const [, target, version, api] = element.match(/([a-zA-Z]+):\s+Android\s+([0-9\.]+)+.*API\s+([0-9]+)/);
          return {target, version, api};
        }).reduce((mount, data) => {
          if (data) mount[data.target] = {version: data.version, API: data.api};
          return mount;
        }, {} as downloadObject["downloadUrls"][0]["androidRequeriments"]);
        return {
          url: data,
          arch,
          androidRequeriments: androidRequeriments
        };
      }));
      dataReturn.push({
        version: version.version,
        downloadUrls: downloadUrls.filter((data) => {
          compareVersions(data.androidRequeriments.version, androidVersion) === 1
        }),
      });
    }
    return dataReturn;
  }

  return {
    host,
    get_apk_download,
    get_apk_versions_url,
  };
}

listPackages("13").then(res => res.get_apk_download("com.android.chrome")).then(res => JSON.stringify(res, null, 2)).then(res => writeFile("./apks.json", res));