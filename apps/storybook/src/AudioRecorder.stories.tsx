import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Audio, AudioRecorder } from '@rogueoak/canopy/branches';
import type { AudioRecording, RecordingError } from '@rogueoak/canopy/branches';

/**
 * Branches/AudioRecorder - the sound-capture Branch (spec 0072), the counterpart to
 * `Branches/Audio`.
 *
 * Every story here needs a real microphone, so this is the one page in the showcase that cannot be
 * proved by a screenshot: press record, let the browser ask for the microphone, and watch the
 * waveform. A dead or muted input shows up in the first second rather than at playback, which is
 * the whole reason the waveform is there.
 *
 * Two things it deliberately does NOT do. It does not play the result back - `Audio` (0071) already
 * does that, and `RecordAndPlay` below composes the two. And it does not upload anything: the
 * component hands you a `Blob`, a `mimeType`, and a duration, and knows nothing about where audio
 * goes.
 *
 * There is no per-story theme code. Toggle the toolbar Light / Dark control and the recorder
 * re-themes through the token layer (spec 0004); `BrandOverride` proves the same seam re-colours
 * the waveform for a consumer brand, which a canvas-drawn waveform could not do.
 */
const meta = {
  title: 'Branches/AudioRecorder',
  component: AudioRecorder,
  parameters: { layout: 'centered' },
  argTypes: {
    maxDurationSeconds: { control: { type: 'number', min: 1 } },
    barCount: { control: { type: 'number', min: 1, max: 128 } },
    showWaveform: { control: 'boolean' },
    startLabel: { control: 'text' },
    stopLabel: { control: 'text' },
  },
  args: {
    maxDurationSeconds: 600,
    barCount: 48,
    showWaveform: true,
  },
} satisfies Meta<typeof AudioRecorder>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default recorder. The microphone is requested when you press record, never on mount - a
 * prompt fired at someone who has not asked to record anything is alarming, usually denied by
 * reflex, and a denied microphone cannot be re-prompted from inside the page.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <AudioRecorder {...args} />
    </div>
  ),
};

/** Fewer, chunkier bars. The waveform is DOM elements, so the count is just a prop. */
export const CoarseWaveform: Story = {
  args: { barCount: 16 },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <AudioRecorder {...args} />
    </div>
  ),
};

/** No waveform at all - the control and the clock. Nothing opens an `AudioContext` in this mode. */
export const WithoutWaveform: Story = {
  args: { showWaveform: false },
  render: (args) => (
    <div className="w-[320px] max-w-full">
      <AudioRecorder {...args} />
    </div>
  ),
};

/**
 * A short cap, so the automatic stop is easy to watch. Reaching `maxDurationSeconds` completes the
 * take normally rather than erroring - running out of time is not a failure, and a note that
 * vanished at the limit would be.
 */
export const ShortLimit: Story = {
  args: { maxDurationSeconds: 5 },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <AudioRecorder {...args} />
    </div>
  ),
};

/** Every string is a defaulted prop, so a consumer can reword or translate the whole component. */
export const CustomCopy: Story = {
  args: {
    startLabel: 'Record a memory',
    stopLabel: 'Finish',
    cancelLabel: 'Start over',
    recordingLabel: 'Listening',
  },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <AudioRecorder {...args} />
    </div>
  ),
};

/**
 * What the component hands back. Press record, say something, stop - the panel below fills in with
 * the blob's size, the container the browser chose (WebM in Chrome and Firefox, mp4 in Safari), and
 * the duration.
 *
 * The duration is measured by the component from a monotonic clock, not read out of the blob:
 * WebM from a `MediaRecorder` routinely carries no duration in its metadata, so asking the file
 * gives you `Infinity` often enough to be a bug rather than an edge case.
 */
function CompletionExample(args: React.ComponentProps<typeof AudioRecorder>) {
  const [recording, setRecording] = React.useState<AudioRecording | null>(null);
  const [error, setError] = React.useState<RecordingError | null>(null);

  const handleComplete = (next: AudioRecording) => {
    setError(null);
    setRecording(next);
  };

  let summary = <p className="text-caption text-text-muted">Nothing recorded yet.</p>;
  if (error) {
    summary = (
      <p className="text-caption text-danger">
        {error.reason}: {error.message}
      </p>
    );
  } else if (recording) {
    summary = (
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-caption">
        <dt className="text-text-muted">Bytes</dt>
        <dd className="tabular-nums">{recording.blob.size}</dd>
        <dt className="text-text-muted">Container</dt>
        <dd>{recording.mimeType}</dd>
        <dt className="text-text-muted">Duration</dt>
        <dd className="tabular-nums">{recording.durationMs} ms</dd>
      </dl>
    );
  }

  return (
    <div className="flex w-[420px] max-w-full flex-col gap-3">
      <AudioRecorder {...args} onComplete={handleComplete} onError={setError} />
      {summary}
    </div>
  );
}

export const ShowsWhatYouGet: Story = {
  render: (args) => <CompletionExample {...args} />,
};

/**
 * The two media Branches composed, which is how a voice note actually ships: `AudioRecorder`
 * captures and hands over a `Blob`, the app turns it into a URL, and `Audio` plays it. Building a
 * player into the recorder would be two players to keep in step.
 */
function RecordAndPlayExample(args: React.ComponentProps<typeof AudioRecorder>) {
  const [url, setUrl] = React.useState<string | null>(null);

  // The object URL is the app's to own and revoke - the design system never makes one, because a
  // component that mints URLs has quietly taken a position on where the audio lives.
  React.useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  const handleComplete = (recording: AudioRecording) => {
    setUrl(URL.createObjectURL(recording.blob));
  };

  let player = <p className="text-caption text-text-muted">Record something to play it back.</p>;
  if (url) player = <Audio src={url} format={['webm']} />;

  return (
    <div className="flex w-[420px] max-w-full flex-col gap-4">
      <AudioRecorder {...args} onComplete={handleComplete} />
      {player}
    </div>
  );
}

export const RecordAndPlay: Story = {
  render: (args) => <RecordAndPlayExample {...args} />,
};

/**
 * Driving the recorder from your own chrome. `onReady` hands over an `AudioRecorderHandle` -
 * `start` / `stop` / `cancel` / `isRecording` / `getDurationMs` - which is Canopy's own interface,
 * not the browser's recorder. There is deliberately no way to reach a `MediaRecorder` from here.
 */
function HandleExample(args: React.ComponentProps<typeof AudioRecorder>) {
  const handleRef = React.useRef<import('@rogueoak/canopy/branches').AudioRecorderHandle | null>(
    null,
  );

  return (
    <div className="flex w-[420px] max-w-full flex-col gap-3">
      <AudioRecorder
        {...args}
        onReady={(recorder) => {
          handleRef.current = recorder;
        }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-text hover:bg-muted"
          onClick={() => handleRef.current?.start()}
        >
          start()
        </button>
        <button
          type="button"
          className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-text hover:bg-muted"
          onClick={() => handleRef.current?.stop()}
        >
          stop()
        </button>
        <button
          type="button"
          className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-text hover:bg-muted"
          onClick={() => handleRef.current?.cancel()}
        >
          cancel()
        </button>
      </div>
    </div>
  );
}

export const DrivenByTheHandle: Story = {
  render: (args) => <HandleExample {...args} />,
};

/**
 * The unsupported state, forced by asking for a container no browser records into. Nothing throws
 * and the control is disabled rather than hidden - a component that vanishes leaves the reader with
 * nothing to read.
 */
export const Unsupported: Story = {
  args: { mimeTypes: ['audio/x-not-a-real-container'] },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <AudioRecorder {...args} />
    </div>
  ),
};

/**
 * Consumer brand override. The waveform is DOM elements carrying semantic role tokens, so
 * re-pointing `--color-primary` on a wrapper - exactly what `buildBrand()` (spec 0028) or an app's
 * own `:root { --color-*: ... }` does - re-themes the control and the bars with no component
 * change. A canvas would have had to read those values out of computed styles and re-read them on
 * every theme change, which is how a waveform ends up stuck in light mode.
 */
export const BrandOverride: Story = {
  render: (args) => (
    <div
      className="w-[420px] max-w-full"
      style={
        {
          '--color-primary': 'oklch(0.62 0.22 15)',
          '--color-primary-foreground': 'oklch(0.98 0 0)',
          '--color-primary-hover': 'oklch(0.56 0.22 15)',
        } as React.CSSProperties
      }
    >
      <AudioRecorder {...args} />
    </div>
  ),
};

/**
 * The dark recorder, shown by default rather than only via the toolbar - the `.dark` class
 * re-points the role vars for this subtree, so the card, the control, and the waveform re-theme
 * with no component change.
 */
export const Dark: Story = {
  render: (args) => (
    <div className="dark w-[420px] max-w-full rounded-lg bg-bg p-6">
      <AudioRecorder {...args} />
    </div>
  ),
};
