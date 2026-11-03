import styled, { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  :root { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #193c39; background: #f4f8f7; color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-size: 1rem; line-height: 1.6; }
  button, input { font: inherit; }
  section { min-width: 0; }
  a { color: #0b665c; text-underline-offset: .2em; overflow-wrap: anywhere; }
  a:hover { color: #093e38; }
  :focus-visible { outline: 3px solid #b45309; outline-offset: 4px; }
  h1, h2, p { margin-top: 0; }
  h1 { font-size: clamp(2rem, 5vw, 3rem); line-height: 1.2; letter-spacing: -.04em; }
  h2 { line-height: 1.3; overflow-wrap: anywhere; }
  .muted { color: #526664; }
  .eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: .75rem; font-weight: 700; }
  .actions { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; }
  .skip-link { position: absolute; top: -100px; left: 1rem; padding: .75rem; background: white; z-index: 2; }
  .skip-link:focus { top: .5rem; }
`
export const Shell = styled.main`
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
  @media (max-width: 480px) {
    padding: 1.75rem 1rem 3rem;
  }
`
export const Nav = styled.nav`
  background: #134e4a;
  color: white;
  > div {
    max-width: 960px;
    margin: auto;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
  }
  a {
    color: white;
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    text-decoration: none;
    padding: 0.4rem 0;
  }
  a:hover,
  a[aria-current='page'] {
    text-decoration: underline;
  }
  .brand {
    font-weight: 750;
    font-size: 1.25rem;
    margin-right: auto;
  }
  .identity {
    overflow-wrap: anywhere;
  }
  button {
    border-color: #a5cec5;
    color: white;
    background: transparent;
  }
  button:hover:not(:disabled) {
    background: #22655e;
  }
  @media (max-width: 480px) {
    > div {
      padding: 0.75rem 1rem;
      gap: 0.5rem 1rem;
    }
    .identity {
      flex-basis: 100%;
    }
  }
`
export const Button = styled.button`
  min-height: 44px;
  padding: 0.55rem 1rem;
  border-radius: 6px;
  border: 1px solid #0b665c;
  background: ${(p) => (p.$secondary ? 'transparent' : '#0b665c')};
  color: ${(p) => (p.$secondary ? '#0b665c' : 'white')};
  font-weight: 650;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${(p) => (p.$secondary ? '#e1efeb' : '#084d45')};
  }
  &:active:not(:disabled) {
    opacity: 0.8;
  }
  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`
export const DeleteButton = styled(Button)`
  color: #a32929;
  border-color: #a32929;
  background: transparent;
  &:hover:not(:disabled) {
    background: #fff0f0;
  }
`
export const Panel = styled.section`
  background: white;
  border: 1px solid #cbdad6;
  border-radius: 10px;
  padding: clamp(1.25rem, 4vw, 2rem);
`
export const Form = styled.form`
  max-width: 520px;
  display: grid;
  gap: 1.25rem;
  label {
    display: grid;
    gap: 0.4rem;
    font-weight: 600;
  }
  input {
    width: 100%;
    min-height: 46px;
    padding: 0.6rem 0.75rem;
    border: 1px solid #748b85;
    border-radius: 6px;
    color: #193c39;
    background: white;
  }
  p {
    margin-bottom: 0;
  }
`
export const Notice = styled.div`
  padding: 0.9rem 1.1rem;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  border-left: 4px solid ${(p) => (p.$error ? '#a32929' : '#0b665c')};
  color: ${(p) => (p.$error ? '#842121' : '#174c3f')};
  background: ${(p) => (p.$error ? '#fff0f0' : '#e1f3e8')};
  overflow-wrap: anywhere;
`
export const BlogList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid #cbdad6;
  li {
    padding: 1.25rem 0;
    border-bottom: 1px solid #cbdad6;
  }
  a {
    font-size: 1.2rem;
    font-weight: 650;
    display: inline-block;
    min-height: 44px;
  }
  p {
    margin: 0;
  }
`
export const BlogPanel = styled(Panel)`
  h1 {
    font-size: clamp(1.75rem, 5vw, 2.7rem);
    overflow-wrap: anywhere;
  }
  .author {
    font-size: 1.15rem;
    color: #526664;
  }
  .source {
    display: inline-block;
    margin: 0.5rem 0 1.5rem;
  }
  .blog-meta {
    border-top: 1px solid #cbdad6;
    padding-top: 1.5rem;
    margin-top: 1rem;
  }
`

export const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  th,
  td {
    padding: 1rem 0.5rem;
    border-bottom: 1px solid #cbdad6;
    overflow-wrap: anywhere;
  }
  th:last-child,
  td:last-child {
    text-align: right;
  }
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
`
export const CommentList = styled.ul`
  padding-left: 1.5rem;
  margin-top: 1.5rem;
  li {
    padding: 0.75rem 0;
    overflow-wrap: anywhere;
    border-bottom: 1px solid #cbdad6;
  }
`
