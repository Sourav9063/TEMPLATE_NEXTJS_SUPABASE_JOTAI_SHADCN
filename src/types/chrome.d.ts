/* Minimal Chrome extension messaging types for externally_connectable */
declare namespace chrome {
  namespace runtime {
    const lastError: { message: string } | undefined;
    function sendMessage(
      extensionId: string,
      message: unknown,
      callback: (response: never) => void,
    ): void;
  }
}
