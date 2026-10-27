// Codifica una carpeta de cuadros JPEG (frame_0001.jpg, ...) a un MP4 H.264 optimizado para web.
// Uso: encode <carpeta> <cuadrosPorSegundo> <salida.mp4>
import AVFoundation
import CoreVideo
import Foundation
import ImageIO

guard CommandLine.arguments.count == 4, let fps = Int32(CommandLine.arguments[2]) else {
    fatalError("uso: encode <carpeta> <cuadrosPorSegundo> <salida.mp4>")
}
let dir = CommandLine.arguments[1]
let out = URL(fileURLWithPath: CommandLine.arguments[3])
let files = try FileManager.default.contentsOfDirectory(atPath: dir).filter { $0.hasSuffix(".jpg") }.sorted()
guard let firstName = files.first else { fatalError("la carpeta no tiene cuadros") }

func load(_ name: String) -> CGImage {
    let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: dir + "/" + name) as CFURL, nil)!
    return CGImageSourceCreateImageAtIndex(src, 0, nil)!
}

let probe = load(firstName)
let w = probe.width, h = probe.height
try? FileManager.default.removeItem(at: out)
let writer = try AVAssetWriter(outputURL: out, fileType: .mp4)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: w,
    AVVideoHeightKey: h,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 2_200_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2,
    ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: w,
        kCVPixelBufferHeightKey as String: h,
    ]
)
writer.shouldOptimizeForNetworkUse = true
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

for (i, name) in files.enumerated() {
    autoreleasepool {
        while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.005) }
        let img = load(name)
        var pb: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
        let buf = pb!
        CVPixelBufferLockBaseAddress(buf, [])
        let ctx = CGContext(
            data: CVPixelBufferGetBaseAddress(buf), width: w, height: h, bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(buf), space: CGColorSpace(name: CGColorSpace.sRGB)!,
            bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
        )!
        ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
        CVPixelBufferUnlockBaseAddress(buf, [])
        adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: fps))
    }
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
if writer.status != .completed { fatalError("falló la codificación: \(String(describing: writer.error))") }
print("ok \(files.count) cuadros -> \(out.path)")
