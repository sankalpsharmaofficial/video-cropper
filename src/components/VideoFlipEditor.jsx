import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

const VideoFlipEditor = ({ videoSource }) => {
	// State management
	const [playing, setPlaying] = useState(false);
	const [volume, setVolume] = useState(1);
	const [muted, setMuted] = useState(false);
	const [playbackRate, setPlaybackRate] = useState(1);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [aspectRatio, setAspectRatio] = useState('9:16');
	const [cropperPosition, setCropperPosition] = useState({ x: 0, y: 0 });
	const [cropperSize, setCropperSize] = useState({ width: 0, height: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [recordings, setRecordings] = useState([]);
	const [cropperActive, setCropperActive] = useState(false);
	const [videoError, setVideoError] = useState(false);
	const [videoLoading, setVideoLoading] = useState(true);

	// Refs
	const videoRef = useRef(null);
	const previewRef = useRef(null);
	const cropperRef = useRef(null);
	const containerRef = useRef(null);

	useEffect(() => {
		if (!videoSource) {
			setVideoError(true);
			return;
		}

		setVideoError(false);
		setVideoLoading(true);
	}, [videoSource]);

	// Format time function
	const formatTime = (timeInSeconds) => {
		const minutes = Math.floor(timeInSeconds / 60);
		const seconds = Math.floor(timeInSeconds % 60);
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	};

	useEffect(() => {
		if (videoRef.current) {
			const video = videoRef.current;
			video.addEventListener('loadedmetadata', () => {
				setDuration(video.duration);
				initializeCropper();
			});

			return () => {
				video.removeEventListener('loadedmetadata', () => {});
			};
		}
	}, []);

	const handleVideoLoad = () => {
		setVideoLoading(false);
	};

	const handleVideoError = () => {
		setVideoError(true);
		setVideoLoading(false);
	};

	const initializeCropper = () => {
		const video = videoRef.current;
		const container = containerRef.current;
		if (!video || !container) return;

		const videoAspect = video.videoWidth / video.videoHeight;
		const containerWidth = container.clientWidth;
		const containerHeight = container.clientHeight;

		// Initialize cropper size based on selected aspect ratio
		const [width, height] = aspectRatio.split(':').map(Number);
		const ratio = width / height;
		const cropperHeight = containerHeight;
		const cropperWidth = cropperHeight * ratio;

		setCropperSize({
			width: cropperWidth,
			height: cropperHeight
		});

		// Center the cropper
		setCropperPosition({
			x: (containerWidth - cropperWidth) / 2,
			y: 0
		});
	};

	const handlePlayPause = () => {
		if (videoRef.current) {
			if (playing) {
				videoRef.current.pause();
				if (previewRef.current) {
					previewRef.current.pause();
				}
			} else {
				videoRef.current.play();
				if (previewRef.current) {
					previewRef.current.play();
				}
			}
			setPlaying(!playing);
		}
	};

	const handleTimeUpdate = () => {
		if (videoRef.current) {
			setCurrentTime(videoRef.current.currentTime);
			// Sync preview video
			if (previewRef.current) {
				previewRef.current.currentTime = videoRef.current.currentTime;
			}
			recordCurrentState();
		}
	};

	const handleVolumeChange = (e) => {
		const value = parseFloat(e.target.value);
		setVolume(value);
		if (videoRef.current) {
			videoRef.current.volume = value;
			if (previewRef.current) {
				previewRef.current.volume = value;
			}
		}
	};

	const toggleMute = () => {
		if (videoRef.current) {
			videoRef.current.muted = !muted;
			if (previewRef.current) {
				previewRef.current.muted = !muted;
			}
			setMuted(!muted);
		}
	};

	const handlePlaybackRateChange = (rate) => {
		setPlaybackRate(rate);
		if (videoRef.current) {
			videoRef.current.playbackRate = rate;
			if (previewRef.current) {
				previewRef.current.playbackRate = rate;
			}
		}
	};

	const handleSeek = (e) => {
		const time = parseFloat(e.target.value);
		setCurrentTime(time);
		if (videoRef.current) {
			videoRef.current.currentTime = time;
			if (previewRef.current) {
				previewRef.current.currentTime = time;
			}
		}
	};

	const handleAspectRatioChange = (ratio) => {
		setAspectRatio(ratio);
		initializeCropper();
	};

	const handleMouseDown = (e) => {
		if (!cropperActive) return;
		setIsDragging(true);
		const cropperRect = cropperRef.current.getBoundingClientRect();
		const offsetX = e.clientX - cropperRect.left;
		const offsetY = e.clientY - cropperRect.top;
		cropperRef.current.dataset.offsetX = offsetX;
		cropperRef.current.dataset.offsetY = offsetY;
	};

	const handleMouseMove = (e) => {
		if (!isDragging || !cropperActive) return;

		const container = containerRef.current;
		const cropper = cropperRef.current;
		if (!container || !cropper) return;

		const containerRect = container.getBoundingClientRect();
		const offsetX = parseFloat(cropper.dataset.offsetX);
		const offsetY = parseFloat(cropper.dataset.offsetY);

		let newX = e.clientX - containerRect.left - offsetX;
		let newY = e.clientY - containerRect.top - offsetY;

		// Constrain movement within container
		newX = Math.max(0, Math.min(newX, containerRect.width - cropperSize.width));
		newY = Math.max(
			0,
			Math.min(newY, containerRect.height - cropperSize.height)
		);

		setCropperPosition({ x: newX, y: newY });
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const recordCurrentState = () => {
		if (!cropperActive) return;

		const newRecording = {
			timeStamp: currentTime,
			coordinates: [
				cropperPosition.x,
				cropperPosition.y,
				cropperPosition.x + cropperSize.width,
				cropperPosition.y + cropperSize.height
			],
			volume: volume,
			playbackRate: playbackRate
		};

		setRecordings((prev) => {
			// Only add if timestamp is different from last recording
			const lastRecording = prev[prev.length - 1];
			if (
				!lastRecording ||
				lastRecording.timeStamp !== newRecording.timeStamp
			) {
				return [...prev, newRecording];
			}
			return prev;
		});
	};

	const downloadJSON = () => {
		const dataStr = JSON.stringify(recordings, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'video-editor-recording.json';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	if (videoError) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
				<div className="bg-gray-800 rounded-lg p-6 text-center">
					<p className="text-red-500">
						Error loading video. Please check the video source.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
			<div className="bg-gray-800 rounded-lg w-full max-w-6xl p-6">
				{/* Header */}
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
					{/* Main video container */}
					<div className="w-2/3">
						<div
							ref={containerRef}
							className="relative bg-black rounded-lg overflow-hidden"
							style={{ aspectRatio: '16/9' }}
						>
							{videoLoading && (
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-white">Loading video...</div>
								</div>
							)}
							<video
								ref={videoRef}
								className="w-full h-full object-contain"
								onTimeUpdate={handleTimeUpdate}
								onLoadedData={handleVideoLoad}
								onError={handleVideoError}
							>
								<source src={videoSource} type="video/mp4" />
								<source src={videoSource} type="video/webm" />
								Your browser does not support the video tag.
							</video>

							{cropperActive && (
								<div
									ref={cropperRef}
									className="absolute border border-white"
									style={{
										left: `${cropperPosition.x}px`,
										top: `${cropperPosition.y}px`,
										width: `${cropperSize.width}px`,
										height: `${cropperSize.height}px`
									}}
									onMouseDown={handleMouseDown}
								>
									{/* Grid overlay */}
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

								{/* Progress bar */}
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

								{/* Time display */}
								<div className="text-white text-sm">
									{formatTime(currentTime)} / {formatTime(duration)}
								</div>

								{/* Volume control */}
								<div className="flex items-center gap-2">
									<button onClick={toggleMute} className="text-white">
										{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
									</button>
									<input
										type="range"
										min="0"
										max="1"
										step="0.1"
										value={volume}
										onChange={handleVolumeChange}
										className="w-24"
									/>
								</div>
							</div>

							{/* Bottom controls */}
							<div className="flex gap-4">
								{/* Playback speed dropdown */}
								<select
									value={playbackRate}
									onChange={(e) =>
										handlePlaybackRateChange(parseFloat(e.target.value))
									}
									className="bg-gray-700 text-white rounded px-3 py-1"
								>
									<option value={1}>Playback speed 1x</option>
									<option value={0.5}>0.5x</option>
									<option value={1.5}>1.5x</option>
									<option value={2}>2x</option>
								</select>

								{/* Aspect ratio dropdown */}
								<select
									value={aspectRatio}
									onChange={(e) => handleAspectRatioChange(e.target.value)}
									className="bg-gray-700 text-white rounded px-3 py-1"
								>
									<option value="9:16">Cropper Aspect Ratio 9:16</option>
									<option value="9:18">9:18</option>
									<option value="4:3">4:3</option>
									<option value="3:4">3:4</option>
									<option value="1:1">1:1</option>
									<option value="4:5">4:5</option>
								</select>
							</div>
						</div>
					</div>

					{/* Preview section */}
					<div className="w-1/3">
						<div className="bg-gray-900 rounded-lg p-4 h-full flex flex-col items-center justify-center">
							<h3 className="text-gray-400 mb-4">Preview</h3>
							{cropperActive ? (
								<video
									ref={previewRef}
									className="w-full object-cover rounded"
									style={{ aspectRatio }}
									onError={handleVideoError}
								>
									<source src={videoSource} type="video/mp4" />
									<source src={videoSource} type="video/webm" />
									Your browser does not support the video tag.
								</video>
							) : (
								<div className="text-center">
									<div className="mb-4">
										<svg
											className="w-12 h-12 mx-auto text-gray-500"
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
						<button
							onClick={downloadJSON}
							className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
						>
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

// Add prop types validation
VideoFlipEditor.defaultProps = {
	videoSource: '/sample-video.mp4'
};

export default VideoFlipEditor;
