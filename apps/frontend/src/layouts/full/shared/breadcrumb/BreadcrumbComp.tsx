import { Icon } from "@iconify/react";
import CardBox from "../../../../components/shared/CardBox";
import { Badge } from "src/components/ui/badge";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
} from "src/components/ui/breadcrumb";
import { ReactNode } from "react";

interface BreadCrumbType {
  subtitle?: string;
  items?: any[];
  title: string;
  children?: ReactNode;
}

const BreadcrumbComp = ({ items, title }: BreadCrumbType) => {
  return (
    <>
      <CardBox className="mb-[30px] py-4">
        <div className="flex justify-between">
          <h6 className="text-base">{title}</h6>

          <div className="flex items-center gap-3">
            <Breadcrumb>
              <BreadcrumbList>
                {items
                  ? items.map((item) => {
                    return (
                      <BreadcrumbItem key={item.title}>
                        {item.to ? (
                          <BreadcrumbLink href={item.to}>
                            <Icon
                              icon="solar:home-2-line-duotone"
                              height={20}
                              className="text-ld"
                            />
                          </BreadcrumbLink>
                        ) : (
                          <Badge variant="lightPrimary">{item.title}</Badge>
                        )}
                      </BreadcrumbItem>
                    )
                  })
                  : ""}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </CardBox>
    </>
  );
};

export default BreadcrumbComp;
