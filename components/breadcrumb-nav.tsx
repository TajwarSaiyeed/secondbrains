'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbNavProps {
  items?: {
    label: string
    href?: string
    isCurrent?: boolean
  }[]
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  const pathname = usePathname()

  // Auto-generate if not provided
  const generateItems = () => {
    const parts = pathname.split('/').filter(Boolean)
    const breadcrumbItems = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        isCurrent: pathname === '/dashboard',
      },
    ]

    let currentPath = ''
    parts.forEach((part, index) => {
      if (part === 'dashboard') return
      currentPath += `/${part}`

      // Basic formatting for IDs or slugs
      const label =
        part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
      breadcrumbItems.push({
        label,
        href: `/dashboard${currentPath}`,
        isCurrent: index === parts.length - 1,
      })
    })

    return breadcrumbItems
  }

  const navItems = items || generateItems()

  return (
    <nav className="text-muted-foreground mb-6 flex items-center space-x-2 text-sm">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                <span className="sr-only">Home</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {navItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3 w-3" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {item.isCurrent || !item.href ? (
                  <BreadcrumbPage className="text-foreground font-medium">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  )
}
