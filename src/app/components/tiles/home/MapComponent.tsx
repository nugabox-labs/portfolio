export default function MapComponent() {
    const gwangjuEmbedUrl = "https://maps.google.com/maps?q=35.1595,126.8526&z=10&output=embed";

    return (
        <div className="w-full h-full relative">
            <iframe
                title="Google Map"
                src={gwangjuEmbedUrl}
                className="w-full h-full border-0 filter transition duration-500 dark:[filter:grayscale(100%)_invert(92%)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
            />
        </div>
    );
}