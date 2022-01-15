import {
  Header,
  Content,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  SkipToContent,
} from "carbon-components-react";
import useAccessStore from "../store/AccessStore";
import styled from "styled-components";

interface PropsType {
  children: any;
  page: string;
}

const MainHeader = (props: PropsType) => {
  const isWorkspaceAdmin = useAccessStore((state) => state.isWorkspaceAdmin);
  const isOrgAdmin = useAccessStore((state) => state.isOrgAdmin);

  console.log("Use access", useAccessStore());
  return (
    <>
      <Header aria-label="Organization Accounting">
        <SkipToContent />
        <HeaderName href="#" prefix="">
          Organization Accounting
        </HeaderName>

        <HeaderNavigation aria-label="">
          <HeaderMenuItem
            href="/accounting/home"
            isCurrentPage={props.page === "home"}
          >
            Home
          </HeaderMenuItem>
          {isWorkspaceAdmin || isOrgAdmin ? (
            <HeaderMenuItem
              href="/accounting/admin"
              isCurrentPage={props.page === "admin"}
            >
              Admin
            </HeaderMenuItem>
          ) : null}
          <HeaderMenuItem
            href="/accounting/ledger"
            isCurrentPage={props.page === "ledger"}
          >
            Ledger
          </HeaderMenuItem>
          <HeaderMenuItem
            href="/accounting/reports"
            isCurrentPage={props.page === "reports"}
          >
            reports
          </HeaderMenuItem>
        </HeaderNavigation>
      </Header>
      <Content>{props.children}</Content>
    </>
  );
};
export default MainHeader;
