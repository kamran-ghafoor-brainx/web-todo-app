import { TextLink } from "@/components/TextLink";

type AuthFooterLinkProps = {
  prompt?: string;
  linkText: string;
  to: string;
};

export function AuthFooterLink({ prompt, linkText, to }: AuthFooterLinkProps) {
  return (
    <p>
      {prompt && `${prompt} `}
      <TextLink to={to}>{linkText}</TextLink>
    </p>
  );
}
