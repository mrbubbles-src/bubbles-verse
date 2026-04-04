const VaultEmbed = ({
  embed,
  caption,
}: {
  embed: string;
  caption?: string;
}) => {
  return (
    <div className="mx-auto mb-4 aspect-video w-full max-w-3xl">
      <iframe
        src={embed}
        title={caption || 'Embedded Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="roundend-md h-full w-full rounded-md shadow-md"
      />
      {caption && (
        <p className="mt-1 text-center text-sm text-gray-600">{caption}</p>
      )}
    </div>
  );
};

export default VaultEmbed;
