import React from "react";

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const ModalContainer = ({
  isOpen,
  onClose,
  children,
  className,
}: ModalContainerProps) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed cursor-pointer [&>*]:cursor-auto inset-0 bg-black/60 dark:bg-white/20 z-50 flex justify-center items-center p-4 ${className}`}
      onClick={handleBackdropClick}
    >
      {children}
    </div>
  );
};

export default ModalContainer;
