// 404 boundary. Also what `notFound()` renders when a verse or collection
// id does not resolve.

import { MessageScreen } from "@/components/ui/MessageScreen";

export default function NotFound() {
  return <MessageScreen kind="notFound" />;
}
