'use client';

import { CaptionPlugin } from '@udecode/plate-caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin as BaseImagePlugin, // Renamed import
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@udecode/plate-media/react';

import { ImagePreview } from '@/components/ui/image-preview';
import { MediaUploadToast } from '@/components/ui/media-upload-toast';

// 1. Create the extended plugin and store it in a variable
const ExtendedImagePlugin = BaseImagePlugin.extend({
  options: {
    disableUploadInsert: true,
    props: {
      caption: [{ type: 'p', children: [{ text: '' }] }],
    },
  },
  render: { afterEditable: ImagePreview }, // Ensure render config is kept
});

export const mediaPlugins = [
  // 2. Use the variable in the mediaPlugins array
  ExtendedImagePlugin,
  MediaEmbedPlugin,
  VideoPlugin,
  AudioPlugin,
  FilePlugin,
  CaptionPlugin.configure({
    options: {
      plugins: [
        // 3. Use the variable in CaptionPlugin's configuration
        ExtendedImagePlugin,
        VideoPlugin,
        AudioPlugin,
        FilePlugin,
        MediaEmbedPlugin,
      ],
    },
  }),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast },
  }),
] as const;
