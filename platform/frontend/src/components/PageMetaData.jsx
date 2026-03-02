const defaultPageMetaData = {
  title: 'MeshLogiq',
  description: 'MeshLogiq is a modern, responsive admin dashboard for managing your mesh network infrastructure.',
  keywords: 'MeshLogiq, admin dashboard, mesh network, network management, monitoring'
};

const PageMetaData = ({
  title,
  description = defaultPageMetaData.description,
  keywords = defaultPageMetaData.keywords
}) => {
  return (
    <>
      <title>{title ? `${title} | ${defaultPageMetaData.title}` : defaultPageMetaData.title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
    </>
  );
};

export default PageMetaData;
