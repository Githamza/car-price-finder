/**
 * Custom hook for downloading images
 * Follows Single Responsibility Principle - only handles download operations
 */
export const useDownload = () => {
  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadWithCustomName = (
    imageUrl: string,
    baseName: string,
    extension: string = "jpg"
  ) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `${baseName}-${timestamp}.${extension}`;
    downloadImage(imageUrl, filename);
  };

  return {
    downloadImage,
    downloadWithCustomName,
  };
};
