import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

const VideoFlipEditor = ({
	videoSource = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
}) => {
	// Basic video states
	const [playing, setPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [muted, setMuted] = useState(false);
	const [playbackRate, setPlaybackRate] = useState(1);

	// Cropper states
	const [aspectRatio, setAspectRatio] = useState('9:16');
	const [cropperActive, setCropperActive] = useState(false);
	const [cropperPosition, setCropperPosition] = useState({ x: 0, y: 0 });
	const [cropperSize, setCropperSize] = useState({ width: 0, height: 0 });
	const [isDragging, setIsDragging] = useState(false);

	// Loading states
	const [videoError, setVideoError] = useState(false);
	const [videoLoading, setVideoLoading] = useState(true);

	// Refs
	const videoRef = useRef(null);
	const previewRef = useRef(null);
	const containerRef = useRef(null);
	const cropperRef = useRef(null);

	// Initialize cropper dimensions when aspect ratio changes
	useEffect(() => {
		if (containerRef.current) {
			const container = containerRef.current;
			const [width, height] = aspectRatio.split(':').map(Number);
			const ratio = width / height;

			const containerHeight = container.clientHeight;
			const cropperHeight = containerHeight;
			const cropperWidth = cropperHeight * ratio;

			setCropperSize({ width: cropperWidth, height: cropperHeight });
			setCropperPosition({
				x: (container.clientWidth - cropperWidth) / 2,
				y: 0
			});
		}
	}, [aspectRatio]);

	// Video event handlers
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleLoadedMetadata = () => {
			setDuration(video.duration);
			setVideoLoading(false);
		};

		const handleTimeUpdate = () => {
			setCurrentTime(video.currentTime);
			if (previewRef.current) {
				previewRef.current.currentTime = video.currentTime;
			}
		};

		video.addEventListener('loadedmetadata', handleLoadedMetadata);
		video.addEventListener('timeupdate', handleTimeUpdate);

		return () => {
			video.removeEventListener('loadedmetadata', handleLoadedMetadata);
			video.removeEventListener('timeupdate', handleTimeUpdate);
		};
	}, []);

	// Playback controls
	const handlePlayPause = () => {
		if (!videoRef.current) return;

		if (playing) {
			videoRef.current.pause();
			previewRef.current?.pause();
		} else {
			videoRef.current.play();
			previewRef.current?.play();
		}
		setPlaying(!playing);
	};

	const handleSeek = (e) => {
		const time = parseFloat(e.target.value);
		if (videoRef.current) {
			videoRef.current.currentTime = time;
			if (previewRef.current) {
				previewRef.current.currentTime = time;
			}
			setCurrentTime(time);
		}
	};

	// Mouse handlers for cropper
	const handleMouseDown = (e) => {
		if (!cropperActive) return;
		setIsDragging(true);
		const cropperRect = cropperRef.current.getBoundingClientRect();
		cropperRef.current.dataset.startX = e.clientX - cropperRect.left;
		cropperRef.current.dataset.startY = e.clientY - cropperRect.top;
	};

	const handleMouseMove = (e) => {
		if (
			!isDragging ||
			!cropperActive ||
			!cropperRef.current ||
			!containerRef.current
		)
			return;

		const container = containerRef.current.getBoundingClientRect();
		const startX = parseFloat(cropperRef.current.dataset.startX);
		const startY = parseFloat(cropperRef.current.dataset.startY);

		let newX = e.clientX - container.left - startX;
		let newY = e.clientY - container.top - startY;

		// Constrain to container bounds
		newX = Math.max(0, Math.min(newX, container.width - cropperSize.width));
		newY = Math.max(0, Math.min(newY, container.height - cropperSize.height));

		setCropperPosition({ x: newX, y: newY });
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	// Format time for display
	const formatTime = (time) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
			<div className="bg-gray-800 rounded-lg w-full max-w-6xl p-6">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-white text-xl">Cropper</h2>
					<div className="flex gap-4">
						<button className="text-gray-300 hover:text-white">
							Preview Session
						</button>
						<button className="text-gray-300 hover:text-white">
							Generate Session
						</button>
					</div>
				</div>

				<div className="flex gap-6">
					{/* Main video */}
					<div className="w-2/3">
						<div
							ref={containerRef}
							className="relative bg-black rounded-lg overflow-hidden"
							style={{ aspectRatio: '16/9' }}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseUp}
						>
							<video
								ref={videoRef}
								className="w-full h-full object-contain"
								src={videoSource}
							/>

							{cropperActive && (
								<div
									ref={cropperRef}
									className="absolute border border-white cursor-move"
									style={{
										left: `${cropperPosition.x}px`,
										top: `${cropperPosition.y}px`,
										width: `${cropperSize.width}px`,
										height: `${cropperSize.height}px`
									}}
									onMouseDown={handleMouseDown}
								>
									<div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
										{[...Array(9)].map((_, i) => (
											<div
												key={i}
												className="border border-white border-opacity-50"
											/>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Video controls */}
						<div className="mt-4 space-y-4">
							<div className="flex items-center gap-4">
								<button onClick={handlePlayPause} className="text-white">
									{playing ? <Pause size={20} /> : <Play size={20} />}
								</button>

								<div className="flex-1">
									<input
										type="range"
										min="0"
										max={duration}
										value={currentTime}
										onChange={handleSeek}
										className="w-full"
									/>
								</div>

								<div className="text-white text-sm">
									{formatTime(currentTime)} / {formatTime(duration)}
								</div>

								<div className="flex items-center gap-2">
									<button
										onClick={() => setMuted(!muted)}
										className="text-white"
									>
										{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
									</button>
									<input
										type="range"
										min="0"
										max="1"
										step="0.1"
										value={volume}
										onChange={(e) => setVolume(parseFloat(e.target.value))}
										className="w-24"
									/>
								</div>
							</div>

							{/* Settings controls */}
							<div className="flex gap-4">
								<select
									value={playbackRate}
									onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
									className="bg-gray-700 text-white rounded px-3 py-1"
								>
									<option value={0.5}>0.5x</option>
									<option value={1}>1x</option>
									<option value={1.5}>1.5x</option>
									<option value={2}>2x</option>
								</select>

								<select
									value={aspectRatio}
									onChange={(e) => setAspectRatio(e.target.value)}
									className="bg-gray-700 text-white rounded px-3 py-1"
								>
									<option value="9:16">9:16</option>
									<option value="9:18">9:18</option>
									<option value="4:3">4:3</option>
									<option value="3:4">3:4</option>
									<option value="1:1">1:1</option>
									<option value="4:5">4:5</option>
								</select>
							</div>
						</div>
					</div>

					{/* Preview */}
					<div className="w-1/3">
						<div className="bg-gray-900 rounded-lg p-4 h-full flex flex-col">
							<h3 className="text-gray-400 mb-4">Preview</h3>
							{cropperActive ? (
								<div
									className="relative w-full bg-black rounded overflow-hidden"
									style={{ height: '400px' }}
								>
									<video
										ref={previewRef}
										className="absolute w-full h-full"
										src={videoSource}
										style={{
											objectFit: 'cover',
											transform: `scale(${containerRef.current?.clientWidth / cropperSize.width || 1})
                                 translate(${-cropperPosition.x}px, ${-cropperPosition.y}px)`,
											transformOrigin: 'top left'
										}}
									/>
								</div>
							) : (
								<div className="flex-1 flex flex-col items-center justify-center">
									<div className="mb-4">
										<svg
											className="w-12 h-12 text-gray-500"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
									<p className="text-gray-400 text-sm">Preview not available</p>
									<p className="text-gray-500 text-xs mt-2">
										Please click on "Start Cropper"
										<br />
										and then play video
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Bottom buttons */}
				<div className="mt-6 flex justify-between">
					<div className="flex gap-3">
						<button
							onClick={() => setCropperActive(true)}
							className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
						>
							Start Cropper
						</button>
						<button
							onClick={() => setCropperActive(false)}
							className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
						>
							Remove Cropper
						</button>
						<button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
							Generate Preview
						</button>
					</div>
					<button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

export default VideoFlipEditor;
