import React, { useContext } from 'react';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { Card } from '../ui/card';
import CodeDialog from './CodeDialog';

interface CodePreviewProps {
    component: React.ReactNode;
    filePath: string;
    title: string;
    className?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ component, filePath, title, className }) => {
    const { isCardShadow, isBorderRadius } = useContext(CustomizerContext);

    // Read the code from the file path (this would need to be implemented with a build-time plugin)
    // For now, we'll use a placeholder
    const code = `// Code from ${filePath}`;

    return (
        <Card
            className={`card no-inset no-ring bg-white dark:bg-darkgray p-0 ${className} ${isCardShadow
                    ? 'dark:shadow-dark-md shadow-md border-none! dark:border-none!'
                    : 'shadow-none border border-ld'
                }`}
            style={{
                borderRadius: `${isBorderRadius}px`,
            }}
        >
            <div className='p-6'>
                <h4 className='text-lg font-semibold mb-4'>{title}</h4>
                {component}
            </div>
            <CodeDialog>{code}</CodeDialog>
        </Card>
    );
};

export default CodePreview;
