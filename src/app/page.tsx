'use client'
import VideoFlipEditor from '../components/VideoFlipEditor'

export default function Home() {
  return (
    <main>
      <VideoFlipEditor videoSource="/path/to/your/video.mp4" />
    </main>
  )
}