export class Establishment {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly ownerId: string,
    public readonly primaryColor: string,
    public readonly secondaryColor: string,
    public readonly phone?: string | null,
    public readonly bio?: string | null,
    public readonly logoUrl?: string | null,
    public readonly bannerUrl?: string | null,
    public readonly cnpj?: string | null,
    public readonly address?: string | null,
    public readonly createdAt?: Date,
  ) {}

  static create(props: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    primaryColor?: string;
    secondaryColor?: string;
    phone?: string | null;
    bio?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    cnpj?: string | null;
    address?: string | null;
    createdAt?: Date;
  }): Establishment {
    return new Establishment(
      props.id,
      props.name,
      props.slug,
      props.ownerId,
      props.primaryColor || '#3B82F6',
      props.secondaryColor || '#1F2937',
      props.phone,
      props.bio,
      props.logoUrl,
      props.bannerUrl,
      props.cnpj,
      props.address,
      props.createdAt || new Date(),
    );
  }
}
