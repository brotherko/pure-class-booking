import React, { useMemo } from 'react';
import { Location } from '../types/db/location';
import { useGet } from 'restful-react';
import Select from 'react-select';

export const LocationSelect = ({ onChange }) => {
  const { data: locations, loading } = useGet<Location[]>({
    path: 'locations',
    resolve: data => {
      return data.data
    }
  })
  const options = useMemo(() => {
    console.log(locations);
    if (locations) {
      const transformed = locations.map((location) => ({
        label: location.names.en,
        value: location.id,
      }))
      return transformed

    }
  }, [locations])

  return (
    <Select options={options} isLoading={loading} onChange={onChange} />
  )

}