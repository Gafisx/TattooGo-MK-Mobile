import * as ImagePicker from 'expo-image-picker';

/**
 * Utilitário de seleção de imagem (expo-image-picker).
 *
 * Substitui o `<input type="file" />` do web. Devolve um resultado tipado
 * (`success` | `canceled` | `denied`) para que a tela trate cada caso sem
 * depender de exceções. O `uri` retornado serve como preview imediato e como
 * fonte do binário enviado ao S3 posteriormente.
 */

export interface PickedImage {
  uri: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  width: number;
  height: number;
}

export type PickImageResult =
  | { status: 'success'; image: PickedImage }
  | { status: 'canceled' }
  | { status: 'denied' };

const DEFAULT_CONTENT_TYPE = 'image/jpeg';

function inferContentType(fileName: string | null | undefined, uri: string): string {
  const candidate = (fileName ?? uri).toLowerCase();
  const dot = candidate.lastIndexOf('.');
  const extension = dot >= 0 ? candidate.slice(dot + 1) : '';
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return DEFAULT_CONTENT_TYPE;
  }
}

function inferFileName(uri: string): string {
  const last = uri.split('/').at(-1);
  if (last && last.length > 0) return last;
  return `portfolio-${Date.now()}.jpg`;
}

/** Abre a biblioteca de fotos e devolve a mídia escolhida (ou o motivo da falha). */
export async function pickPortfolioImage(): Promise<PickImageResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: 'denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.9,
  });

  if (result.canceled) {
    return { status: 'canceled' };
  }

  const asset = result.assets.at(0);
  if (!asset) {
    return { status: 'canceled' };
  }

  return {
    status: 'success',
    image: {
      uri: asset.uri,
      fileName: asset.fileName ?? inferFileName(asset.uri),
      contentType: asset.mimeType ?? inferContentType(asset.fileName, asset.uri),
      fileSize: asset.fileSize ?? 0,
      width: asset.width,
      height: asset.height,
    },
  };
}
