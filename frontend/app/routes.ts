// app/routes.ts
import { type RouteConfig, index, route } from '@react-router/dev/routes';

const routes = [
	index('./routes/_index.tsx'),
	route('rechtliches', './routes/rechtliches.tsx'),
] satisfies RouteConfig;

export default routes;
