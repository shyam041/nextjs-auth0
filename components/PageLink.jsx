"use client"
import { useState, useEffect, useMemo } from "react"
// Carbon CSS
import "carbon-components/scss/_theme.scss"
import "carbon-components/scss/_themes.scss"
import "carbon-components/scss/components/data-table/_index.scss"
import "carbon-components/scss/components/pagination/_index.scss"
import {
    DataTable,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    Pagination,
} from "carbon-components-react"
// Hooks
import { useDocuments, useDeleteDocument } from "@/hooks/api"
// Constants
import { documentTableHeaders as headers } from "@/constants"
// Components
import TryAgain from "./try-again"
import SearchDocuments from "./search-document"
import LoadingSkelton from "./loading-skelton"
import DocumentRow from "./document-row"

type SortDirection = "ASC" | "DESC" | "NONE"
type SortKey = "document_name" | "tag" | "uploaded_by" | "uploaded_on" | "focus_area"

export default function DocumentTable() {
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
    const [sortKey, setSortKey] = useState<SortKey>("document_name")
    const [sortDirection, setSortDirection] = useState<SortDirection>("DESC")

    const { data, isLoading, isError, error, refetch } = useDocuments({
        page,
        items_per_page: pageSize,
        sort_by: sortKey,
        sort_order: sortDirection.toLowerCase() as "asc" | "desc",
        search_document_name: searchTerm || undefined,
    })

    const deleteDocument = useDeleteDocument()

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.trim().toLowerCase())
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const filteredDocuments = useMemo(() => {
        if (!data?.document_list) return []
        return data.document_list.filter((doc) => {
            const term = debouncedSearchTerm
            return (
                doc.document_name.toLowerCase().includes(term) ||
                doc.tag?.toLowerCase().includes(term) ||
                doc.focus_area?.toLowerCase().includes(term)
            )
        })
    }, [data, debouncedSearchTerm])

    const rows = useMemo(
        () =>
            filteredDocuments.map((doc) => ({
                id: doc.id,
                document_name: doc.document_name,
                tag: doc.tag,
                uploaded_by: doc.uploaded_by,
                uploaded_on: doc.uploaded_on,
                focus_area: doc.focus_area,
                actions: doc,
            })),
        [filteredDocuments]
    )

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
    }

    const handleDelete = async (doc: any) => {
        if (confirm(`Delete "${doc.document_name}"?`)) {
            try {
                await deleteDocument.mutateAsync(doc.document_uri)
                refetch()
            } catch (err) {
                console.error("Delete failed:", err)
            }
        }
    }

    const handleDownload = (doc: any) => {
        console.log("Download:", doc)
    }

    const handleSort = (key: string) => {
        if (key === "actions") return // Don't sort actions column
        
        const sortableKey = key as SortKey
        
        if (sortKey === sortableKey) {
            // Toggle direction if same key
            if (sortDirection === "DESC") {
                setSortDirection("ASC")
            } else if (sortDirection === "ASC") {
                setSortDirection("NONE")
                setSortKey("document_name") // Reset to default
            } else {
                setSortDirection("DESC")
            }
        } else {
            // New key, start with DESC
            setSortKey(sortableKey)
            setSortDirection("DESC")
        }
    }

    if (isError) {
        return <TryAgain error={error} refetch={refetch} />
    }

    // Add isSortable property to headers for sortable columns
    const sortableHeaders = headers.map(header => ({
        ...header,
        isSortable: header.key !== "actions",
    }))

    return (
        <>
            <SearchDocuments onSubmit={handleSearch} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            {isLoading ? (
                <LoadingSkelton />
            ) : (
                <>
                    <DataTable
                        rows={rows}
                        headers={sortableHeaders}
                        isSortable
                        sortRow={(a, b, { key, sortDirection }) => {
                            const valA = a[key] || ""
                            const valB = b[key] || ""
                            
                            // For date sorting, convert to timestamps
                            if (key === "uploaded_on") {
                                const dateA = new Date(valA).getTime()
                                const dateB = new Date(valB).getTime()
                                if (dateA < dateB) return sortDirection === "ASC" ? -1 : 1
                                if (dateA > dateB) return sortDirection === "ASC" ? 1 : -1
                                return 0
                            }
                            
                            // For string sorting
                            if (valA < valB) return sortDirection === "ASC" ? -1 : 1
                            if (valA > valB) return sortDirection === "ASC" ? 1 : -1
                            return 0
                        }}
                        render={({ 
                            rows, 
                            headers, 
                            getHeaderProps, 
                            getTableProps, 
                            getRowProps,
                            getTableContainerProps 
                        }) => (
                            <TableContainer {...getTableContainerProps()}>
                                <Table {...getTableProps()}>
                                    <TableHead>
                                        <TableRow>
                                            {headers.map((header) => {
                                                const { key, ...rest } = getHeaderProps({ 
                                                    header,
                                                    onClick: () => handleSort(header.key),
                                                    isSortable: header.isSortable,
                                                })
                                                return (
                                                    <TableHeader
                                                        key={key}
                                                        {...rest}
                                                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                        isSortable={header.isSortable}
                                                        sortDirection={
                                                            sortKey === header.key 
                                                                ? sortDirection 
                                                                : "NONE"
                                                        }
                                                    >
                                                        {header.header}
                                                    </TableHeader>
                                                )
                                            })}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map((row) => (
                                            <DocumentRow
                                                key={row.id}
                                                row={row}
                                                handleDownload={handleDownload}
                                                handleDelete={handleDelete}
                                                {...getRowProps({ row })}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    />
                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        itemsPerPageText=""
                        pageSizes={[10, 20, 30]}
                        totalItems={data?.total_no_of_documents || 0}
                        onChange={({ page, pageSize }) => {
                            setPage(page)
                            setPageSize(pageSize)
                        }}
                    />
                </>
            )}
        </>
    )
}
