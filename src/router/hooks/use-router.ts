import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from './use-params';

export function useRouter() {
  const navigate = useNavigate();
  const params = useParams();
  const router = useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      reload: () => window.location.reload(),
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      novel: (path: string) => {
        if (path) {
          navigate(`/novels/${params.novelId}/${path}${location.search}`);
        } else {
          navigate(`/novels/${params.novelId}${location.search}`);
        }
      },
      prompts: (path: string) => {
        if (/^\/novels/.test(location.pathname)) {
          navigate(`/novels/${params.novelId}/prompts${path}${location.search}`);
        } else {
          navigate(`/prompts${path}${location.search}`);
        }
      },
    }),
    [navigate],
  );

  return router;
}
