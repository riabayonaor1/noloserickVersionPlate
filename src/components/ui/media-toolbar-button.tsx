'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { isUrl } from '@udecode/plate';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@udecode/plate-media/react';
import { useEditorRef } from '@udecode/plate/react';
import {
  AudioLinesIcon,
  FileUpIcon,
  FilmIcon,
  ImageIcon,
  LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFilePicker } from 'use-file-picker';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import {
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from './toolbar';

const MEDIA_CONFIG: Record<
  string,
  {
    accept: string[];
    icon: React.ReactNode;
    title: string;
    tooltip: string;
  }
> = {
  [AudioPlugin.key]: {
    accept: ['audio/*'],
    icon: <AudioLinesIcon className="size-4" />,
    title: 'Insert Audio',
    tooltip: 'Audio',
  },
  [FilePlugin.key]: {
    accept: ['*'],
    icon: <FileUpIcon className="size-4" />,
    title: 'Insert File',
    tooltip: 'File',
  },
  [ImagePlugin.key]: {
    accept: ['image/*'],
    icon: <ImageIcon className="size-4" />,
    title: 'Insert Image',
    tooltip: 'Image',
  },
  [VideoPlugin.key]: {
    accept: ['video/*'],
    icon: <FilmIcon className="size-4" />,
    title: 'Insert Video',
    tooltip: 'Video',
  },
};

export function MediaToolbarButton({
  nodeType,
  ...props
}: DropdownMenuProps & { nodeType: string }) {
  const currentConfig = MEDIA_CONFIG[nodeType];

  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const dropdownTriggerRef = React.useRef<HTMLButtonElement>(null);

  const { openFilePicker } = useFilePicker({
    accept: currentConfig.accept,
    multiple: true,
    onFilesSelected: ({ plainFiles: updatedFiles }) => {
      editor.getTransforms(PlaceholderPlugin).insert.media(updatedFiles);
    },
  });

  return (
    <>
      <ToolbarSplitButton
        onClick={() => {
          openFilePicker();
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        pressed={open}
      >
        <ToolbarSplitButtonPrimary>
          {currentConfig.icon}
        </ToolbarSplitButtonPrimary>

        <DropdownMenu
          open={open}
          onOpenChange={setOpen}
          modal={false}
          {...props}
        >
          <DropdownMenuTrigger asChild>
            <ToolbarSplitButtonSecondary ref={dropdownTriggerRef} />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            onClick={(e) => e.stopPropagation()}
            align="start"
            alignOffset={-32}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => openFilePicker()}>
                {currentConfig.icon}
                Upload from computer
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <LinkIcon />
                Insert via URL
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarSplitButton>

      <AlertDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);
        }}
      >
        <AlertDialogContent
          className="gap-6"
          onCloseAutoFocus={(event) => {
            // When the AlertDialog closes, explicitly return focus to the dropdown trigger.
            // This helps prevent focus from being trapped in the dialog when it's hidden.
            if (dropdownTriggerRef.current) {
              dropdownTriggerRef.current.focus();
              event.preventDefault(); // Prevent Radix's default focus return logic
            }
          }}
        >
          <MediaUrlDialogContent
            currentConfig={currentConfig}
            nodeType={nodeType}
            setOpen={setDialogOpen}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MediaUrlDialogContent({
  currentConfig,
  nodeType,
  setOpen,
}: {
  currentConfig: (typeof MEDIA_CONFIG)[string];
  nodeType: string;
  setOpen: (value: boolean) => void;
}) {
  const editor = useEditorRef();
  const [url, setUrl] = React.useState('');

  const embedMedia = React.useCallback(async () => {
    console.log('embedMedia: Original URL received:', url);

    if (!isUrl(url)) {
      toast.error('Invalid URL format.');
      console.log('embedMedia: Invalid URL format:', url);
      return;
    }

    // Regex updated to better handle query parameters and specific TikTok URL structures.
    // It matches:
    // - tiktok.com/@username/video/12345... (and query params)
    // - vm.tiktok.com/shortcode (and query params)
    const TIKTOK_REGEX = /^(https?:\/\/)?(www\.)?(tiktok\.com\/[^/]+\/video\/[0-9]+|vm\.tiktok\.com\/[A-Za-z0-9]+)/;
    const isTikTokUrl = TIKTOK_REGEX.test(url);
    console.log('embedMedia: Is TikTok URL?', isTikTokUrl, '; URL tested:', url);

    if (isTikTokUrl) {
      console.log('embedMedia: Processing as TikTok URL:', url);
      try {
        // Strip query parameters for the oEmbed request, as some oEmbed providers prefer canonical URLs.
        let tiktokUrlForOembed = url;
        const queryParamIndex = tiktokUrlForOembed.indexOf('?');
        if (queryParamIndex > -1) {
          tiktokUrlForOembed = tiktokUrlForOembed.substring(0, queryParamIndex);
        }
        console.log('embedMedia: Canonical TikTok URL for oEmbed:', tiktokUrlForOembed);

        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrlForOembed)}`;
        console.log('embedMedia: Constructed oEmbed URL:', oembedUrl);

        const response = await fetch(oembedUrl);
        console.log('embedMedia: Raw response from oEmbed fetch:', response);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('embedMedia: TikTok oEmbed fetch failed:', response.status, response.statusText, errorText);
          throw new Error(`Failed to fetch TikTok video information. Status: ${response.status}. Please check the URL or try again.`);
        }

        const data = await response.json();
        console.log('embedMedia: Parsed JSON data from oEmbed response:', data);

        const html = data.html;
        if (!html) {
          console.error('embedMedia: No HTML found in TikTok oEmbed response object:', data);
          throw new Error('Could not extract embed code from TikTok response. The video may be private or unavailable.');
        }
        console.log('embedMedia: Extracted HTML for embedding:', html);

        setOpen(false);
        const nodeData = {
          type: MediaEmbedPlugin.key,
          url: url, // Keep original URL for reference
          html: html,
          children: [{ text: '' }], // Required by Plate
        };
        console.log('embedMedia: Inserting node data:', nodeData);
        editor.tf.insertNodes(nodeData);
        console.log('embedMedia: TikTok video node inserted.');
        return;
      } catch (error)
      {
        console.error('embedMedia: Error processing TikTok URL:', error);
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred while embedding the TikTok video.');
        return;
      }
    }

    // Existing behavior for non-TikTok URLs
    console.log('embedMedia: Processing as non-TikTok URL:', url);
    setOpen(false);
    const nodeData: any = {
      children: [{ text: '' }],
      name: nodeType === FilePlugin.key ? url.split('/').pop() : undefined,
      type: nodeType, // This might need adjustment if VideoPlugin.key is used for YouTube/Vimeo embeds via URL
      url,
    };

    // It seems MediaEmbedPlugin.key is used for YouTube/Vimeo too.
    // If the nodeType is VideoPlugin.key, we should probably change it to MediaEmbedPlugin.key for consistency if it's not a direct video file.
    // However, the original logic uses `nodeType` directly. Let's stick to that for now for non-TikTok URLs
    // and assume the calling context (MediaToolbarButton) correctly sets `nodeType` for video embeds.
    // The prompt mentions `VideoPlugin.key` or `MediaEmbedPlugin.key` for TikTok. We've used `MediaEmbedPlugin.key`.

    if (nodeType === ImagePlugin.key) {
      nodeData.caption = [{ type: 'p', children: [{ text: '' }] }];
    }
    editor.tf.insertNodes(nodeData);
  }, [url, editor, nodeType, setOpen]);

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{currentConfig.title}</AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription className="group relative w-full">
        <label
          className="absolute top-1/2 block -translate-y-1/2 cursor-text px-1 text-sm text-muted-foreground/70 transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:text-xs group-focus-within:font-medium group-focus-within:text-foreground has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:text-xs has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground"
          htmlFor="url"
        >
          <span className="inline-flex bg-background px-2">URL</span>
        </label>
        <Input
          id="url"
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') embedMedia();
          }}
          placeholder=""
          type="url"
          autoFocus
        />
      </AlertDialogDescription>

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            embedMedia();
          }}
        >
          Accept
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
