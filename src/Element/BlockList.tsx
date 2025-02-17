import { FormattedMessage } from "react-intl";
import MuteButton from "Element/MuteButton";
import BlockButton from "Element/BlockButton";
import ProfilePreview from "Element/ProfilePreview";
import useModeration from "Hooks/useModeration";

import messages from "./messages";

interface BlockListProps {
  variant: "muted" | "blocked";
}

export default function BlockList({ variant }: BlockListProps) {
  const { blocked, muted } = useModeration();

  return (
    <div className="main-content">
      {variant === "muted" && (
        <>
          <h4>
            <FormattedMessage {...messages.MuteCount} values={{ n: muted.length }} />
          </h4>
          {muted.map(a => {
            return <ProfilePreview actions={<MuteButton pubkey={a} />} pubkey={a} options={{ about: false }} key={a} />;
          })}
        </>
      )}
      {variant === "blocked" && (
        <>
          <h4>
            <FormattedMessage {...messages.BlockCount} values={{ n: blocked.length }} />
          </h4>
          {blocked.map(a => {
            return (
              <ProfilePreview actions={<BlockButton pubkey={a} />} pubkey={a} options={{ about: false }} key={a} />
            );
          })}
        </>
      )}
    </div>
  );
}
