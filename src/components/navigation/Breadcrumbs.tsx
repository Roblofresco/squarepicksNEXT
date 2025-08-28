import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export type BreadcrumbItem = {
	label: string;
	href?: string;
};

export type BreadcrumbsProps = {
	items?: BreadcrumbItem[];
	className?: string;
	homeHref?: string;
	ellipsisOnly?: boolean;
	backHref?: string;
	appendEllipsisHref?: string; // When provided (and not ellipsisOnly), render ... that navigates to this href
	ellipsisUseHistory?: boolean; // kept for compatibility; ignored
};

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
	items = [],
	className,
	homeHref = '/lobby',
	ellipsisOnly = false,
	backHref,
	appendEllipsisHref,
	ellipsisUseHistory = false, // default false; ignored
}) => {
	const router = useRouter();

	const handleBack = () => {
		// History disabled: always go to explicit target
		router.push(backHref || homeHref);
	};

	const handleKeyBack: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleBack();
		}
	};

	return (
		<nav aria-label="Breadcrumb" className={clsx('flex items-center gap-2 text-sm text-gray-300', className)}>
			{/* Home icon */}
			<Link
				href={homeHref}
				className="inline-flex items-center hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-1/60 rounded"
				aria-label="Home"
			>
				<Home className="w-4 h-4" />
			</Link>
			<span className="opacity-60">/</span>

			{ellipsisOnly ? (
				<>
					<button
						type="button"
						onClick={handleBack}
						onKeyDown={handleKeyBack}
						className="opacity-80 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-1/60 rounded px-1"
						aria-label="Back"
					>
						…
					</button>
					<span className="opacity-60">/</span>
				</>
			) : (
				<>
					{items.map((item, index) => {
						const isLobby = item.label.toLowerCase() === 'lobby';
						return (
							<React.Fragment key={`${item.label}-${index}`}>
								{index > 0 && <span className="opacity-60">/</span>}
								{isLobby ? (
									<Link href={item.href || homeHref} className="inline-flex items-center hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-1/60 rounded" aria-label="Home">
										<Home className="w-4 h-4" />
									</Link>
								) : item.href ? (
									<Link href={item.href} className="hover:text-text-primary">
										{item.label}
									</Link>
								) : (
									<span>{item.label}</span>
								)}
							</React.Fragment>
						);
					})}
					{appendEllipsisHref ? (
						<>
							<span className="opacity-60">/</span>
							<Link href={appendEllipsisHref} aria-label="Next" className="opacity-80 hover:text-text-primary px-1">…</Link>
							<span className="opacity-60">/</span>
						</>
					) : (
						<span className="opacity-60">/</span>
					)}
				</>
			)}
		</nav>
	);
};

export default Breadcrumbs;
