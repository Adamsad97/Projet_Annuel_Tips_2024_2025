export default defineEventHandler(async () => {
  const tips = [
    { id: 1, updatedAt: '2025-12-01' },
    { id: 2, updatedAt: '2025-11-28' },
    { id: 42, updatedAt: '2025-12-02' },
  ];

  return tips.map((tip) => {
    return {
      loc: `/tips/${tip.id}`,
      lastmod: new Date(tip.updatedAt),
    };
  });
});
