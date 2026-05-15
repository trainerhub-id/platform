import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { RundownTemplateList } from './components/RundownTemplateList';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('rundown-templates');

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="sticky top-[88px] z-[85] bg-white dark:bg-darkgray w-full justify-start gap-4 shadow-md backdrop-blur-sm pb-0">
                    <TabsTrigger value="rundown-templates" className="px-4 py-3">Rundown Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="rundown-templates" className="mt-6">
                    <RundownTemplateList />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Settings;
