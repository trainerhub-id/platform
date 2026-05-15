
import React, { useContext } from "react";
import { CustomizerContext } from "src/context/CustomizerContext";
import { Card } from "../ui/card";

interface MyAppProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}
const CardBox: React.FC<MyAppProps> = ({ children, className, ...props }) => {
  const { isCardShadow, isBorderRadius } =
    useContext(CustomizerContext);
  return (
    <Card
      className={`card no-inset no-ring bg-white dark:bg-darkgray border border-border/30 dark:border-darkborder/30 min-w-0 overflow-hidden ${className} ${isCardShadow
        ? "dark:shadow-dark-md shadow-md"
        : "shadow-none"
        } `}
      style={{
        borderRadius: `${isBorderRadius}px`,
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

export default CardBox;
