const isYouTubeUrl = (url = "") => {
  return /youtube\.com|youtu\.be/.test(url);
};

const getYouTubeVideoId = (url = "") => {
  try {
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1].split("?")[0];
    }

    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get("v");
  } catch (error) {
    return null;
  }
};

const getYouTubeThumbnail = (url = "") => {
  if (!isYouTubeUrl(url)) return null;

  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const isBase64Image = (value = "") => {
  return typeof value === "string" && value.startsWith("data:image/");
};

module.exports = {
  getYouTubeThumbnail,
  isBase64Image
};