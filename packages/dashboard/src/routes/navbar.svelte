<script lang="ts">
    import User24 from "carbon-icons-svelte/lib/User24";
    import {
      Header,
      HeaderNav,
      HeaderNavItem,
      HeaderGlobalAction,
      HeaderNavMenu,
      SkipToContent,
      Content,
      Grid,
      Row,
      Column,
HeaderUtilities,
    } from "carbon-components-svelte";
  
    let isSideNavOpen = false;
  </script>
  
  <Header company="inlang" platformName=" Svelte" bind:isSideNavOpen>
    <div slot="skip-to-content">
      <SkipToContent />
    </div>
  
    <HeaderNav>
      <HeaderNavItem href="/" text="Projects" />
      <HeaderNavItem href="/" text="Organizations" />
    </HeaderNav>
    <HeaderUtilities>
      <HeaderGlobalAction aria-label="My profile" icon={User24}/>
    </HeaderUtilities> 
  </Header>
  
  <Content>
    <Grid>
      <Row>
        <Column>
          <h1>Welcome</h1>
        </Column>
      </Row>
    </Grid>
  </Content>