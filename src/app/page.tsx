
'use client'
import VideoFlipEditor from '../components/VideoFlipEditor'

export default function Home() {
  return (
    <main>
      <VideoFlipEditor videoSource="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" />
    </main>
  )
}
