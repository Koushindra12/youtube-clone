import { Suspense } from 'react';
import { getVideo, getRegularVideos } from '@/data/videos';
import { getChannel } from '@/data/channels';
import { comments } from '@/data/comments';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';

interface WatchPageProps {
  searchParams: Promise<{ v?: string }>;
}

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const params = await searchParams;
  const videoId = params.v || 'v1';
  const video = getVideo(videoId);
  const channel = getChannel(video.channelId);
  const related = getRegularVideos().filter((v) => v.id !== video.id).slice(0, 10);

  return (
    <Suspense fallback={<div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading...</div>}>
      <VideoPlayer video={video} channel={channel} comments={comments} related={related} />
    </Suspense>
  );
}
