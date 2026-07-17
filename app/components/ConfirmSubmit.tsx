"use client";

export default function ConfirmSubmit({
  mensagem,
  className = "btn-danger",
  formAction,
  children,
}: {
  mensagem: string;
  className?: string;
  formAction?: (fd: FormData) => void | Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      formAction={formAction}
      onClick={(e) => {
        if (!confirm(mensagem)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
