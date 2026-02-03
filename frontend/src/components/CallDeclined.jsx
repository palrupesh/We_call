import { useEffect } from "react";

function CallDeclined({ reason = "declined", message, onDismiss }) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const title = reason === "busy" ? "User busy" : "Call declined";
    const defaultMessage =
        reason === "busy"
            ? "The other user is already on a call"
            : "The other user declined your call";

    return (
        <div className="call-banner declined">
            <div>
                <strong>{title}</strong>
                <p className="muted">{message || defaultMessage}</p>
            </div>
        </div>
    );
}

export default CallDeclined;
