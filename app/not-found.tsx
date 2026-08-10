// 404 boundary. Also what `notFound()` renders when a verse or collection
// id does not resolve.

import { T } from "@/lib/i18n/strings";
import { MessageScreen } from "@/components/ui/MessageScreen";

export default function NotFound() {
  const t = T.es;
  return (
    <MessageScreen
      title={t.notFoundTitle}
      body={t.notFoundBody}
      homeLabel={t.errorHome}
    />
  );
}
