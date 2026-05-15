

import { Icon } from '@iconify/react';
import SimpleBar from 'simplebar-react';

import { useState } from 'react';

import { useContext } from 'react';
import { CustomizerContext } from 'src/context/CustomizerContext';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from 'src/components/ui/tooltip';

const CodeDialog = ({ children }: any) => {
  const { isBorderRadius } = useContext(CustomizerContext);

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    });
  };

  return (
    <div
      className="px-6 py-2 bg-gray-100 dark:bg-white/2 "
      style={{
        borderBottomLeftRadius: `${isBorderRadius}px`,
        borderBottomRightRadius: `${isBorderRadius}px`,
      }}
    >
      <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-end'}`}>
        <h5
          className={`text-base text-dark font-semibold dark:text-white ${isOpen ? 'block' : 'hidden'
            }`}
        >
          Sample Code
        </h5>
        <TooltipProvider>
          <div className="flex items-center gap-2">
            {/* Show/Hide Code Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="group hover:bg-lightprimary hover:cursor-pointer p-2 
                  text-xs py-1 px-1.5 rounded-full text-ld border border-dark/15 dark:border-white/20 hover:border-lightprimary
                  "
                >
                  {isOpen ? 'Hide Code' : 'Show Code'}
                </button>
              </TooltipTrigger>
              <TooltipContent className="whitespace-nowrap">
                {isOpen ? 'Hide Code' : 'Show Code'}
              </TooltipContent>
            </Tooltip>

            {/* Copy Code Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2" onClick={handleCopy}>
                  {copied ? (
                    <Icon icon="charm:tick" width={20} height={20} className="text-primary" />
                  ) : (
                    <Icon
                      icon="qlementine-icons:copy-16"
                      className="text-bodytext hover:text-primary"
                      width={20}
                      height={20}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="whitespace-nowrap">Copy Code</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <div
        className={`code-modal rounded-md rounded-t-none p-0 my-3 bg-gray-100 dark:bg-transparent overflow-hidden ${isOpen ? 'block' : 'hidden'
          }`}
      >
        <SimpleBar className="max-h-[400px]">
          <pre className="m-0 p-4 bg-[#1e1e1e] text-gray-100 text-xs leading-5 overflow-x-auto">
            <code>{children}</code>
          </pre>
        </SimpleBar>
      </div>
    </div>
  );
};

export default CodeDialog;
