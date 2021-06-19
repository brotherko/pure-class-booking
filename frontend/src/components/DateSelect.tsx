import React, { useMemo, useState } from 'react';
import { useGet } from 'restful-react';
import Select from 'react-select';
import { ApiResponse } from '../../../functions/src/modules/api-service/types/api-response';
import { Location } from '../../../functions/src/services/db/types/location';

export const DateSelect = () => {
  const { data: raw, loading } = useGet<ApiResponse<Location[]>>({
    path: 'locations'
  })
  const options = useMemo(() => {
    if (!raw) {
      return []
    }
    const { data: locations } = raw;
    const transformed = locations.map((location) => ({
      label: location.names.en,
      value: location.id,
    }))
    return transformed
  }, [raw])

  return (
    <Select options={options} isLoading={loading} />
  )

}