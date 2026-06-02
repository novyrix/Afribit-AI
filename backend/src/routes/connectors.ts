import { Router } from 'express';
import { listManifests, getManifest } from '../connectors/registry';

const router = Router();

/** GET /connectors — public connector directory */
router.get('/', (req, res) => {
  const { category, status } = req.query as { category?: string; status?: string };
  let manifests = listManifests();
  if (category) manifests = manifests.filter((m) => m.category === category);
  if (status) manifests = manifests.filter((m) => m.status === status);
  res.json({ connectors: manifests, total: manifests.length });
});

/** GET /connectors/:id — single connector manifest */
router.get('/:id', (req, res) => {
  const manifest = getManifest(req.params.id);
  if (!manifest) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }
  res.json(manifest);
});

export default router;
